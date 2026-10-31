// Staff module — OWNER: backend-parcel (routes) + frontend-staff (views).
//
// Every route below is the agreed contract. All of them answer HTTP 501 until
// they are implemented. To implement one: replace the stubPage(...) call with a
// real handler. Keep the path and the rendered template name unless the manager
// approves a change, otherwise other people's links and forms break.
//
// Guarded by app.js: every route here already requires a signed-in staff user.

const express = require('express');
const { stubPage } = require('../utils/stub');
const { readJson, writeJson } = require('../utils/db');
const { logAction } = require( '../utils/logger' );
const { generatePickupCode, nextId } = require('../utils/id');
const { countByStatus, createParcel } = require('../utils/parcels');
const {
  PACKAGE_STATUSES,
  PACKAGE_TYPES,
  canNotify,
  canPickup,
  canReportException,
  canShelve
} = require('../utils/packageStatus');
const { paginate } = require('../utils/pagination');
const { trimText } = require('../utils/request');
const router = express.Router();

// ---------------------------------------------------------------- helpers

// Renders the receive-parcel form, with the customer list for its dropdown.
function renderPackageForm(res,options = {}){
  const users = readJson('users.json',[]);
  const customers = users.filter((user) => user.role === 'customer');

  return res.render('staff/package-form',{
    title: 'Receive parcels',
    customers,
    types: PACKAGE_TYPES,
    success: options.success || null,
    error: options.error || null
  });
}

// Appends one tracking event and writes it back to tracking.json.
function addTracking(packageId,status,description){
  const tracking = readJson('tracking.json',[]);
  tracking.push({
    id: nextId('TRK',tracking),
    packageId,
    status,
    description,
    operator: global.currentUser ? global.currentUser.username : 'system',
    createdAt: new Date().toISOString()
  });
  writeJson('tracking.json',tracking);
}

// Replaces the supported notification placeholders with parcel values.
function renderNotification(template, values) {
  return Object.keys(values).reduce(
    (text, key) => text.split('{{' + key + '}}').join(String(values[key])),
    template
  );
}

// ---------------------------------------------------------------- dashboard
router.get('/dashboard', (req, res) => {
  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);

  return res.render('staff/dashboard', {
    title: 'Staff dashboard',
    counts: countByStatus(packages, PACKAGE_STATUSES),
    totalPackages: packages.length,
    activeShelves: shelves.filter((shelf) => shelf.status === 'Active').length,
    recentArrivals: [...packages]
      .sort((left, right) => new Date(right.arrivedAt) - new Date(left.arrivedAt))
      .slice(0, 5)
  });
});

// ------------------------------------------------------------------ parcels
router.get('/packages', (req, res) => {
  const packages = readJson('packages.json', []);
  const q = trimText(req.query.q).toLowerCase();
  const status = trimText(req.query.status);
  const type = trimText(req.query.type);

  const filtered = packages
    .filter((parcel) => {
      const target = [parcel.trackingNo, parcel.recipientName, parcel.recipientPhone, parcel.pickupCode]
        .join(' ').toLowerCase();
      return (!q || target.includes(q))
        && (!status || parcel.status === status)
        && (!type || parcel.type === type);
    })
    .sort((left, right) => new Date(right.arrivedAt) - new Date(left.arrivedAt));

  const result = paginate(filtered, {
    page: req.query.page,
    pageSize: 10,
    path: '/staff/packages',
    query: { q: req.query.q || '', status, type }
  });

  return res.render('staff/packages', {
    title: 'Parcels',
    packages: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    pagination: result.pagination,
    filters: { q: req.query.q || '', status, type },
    statuses: PACKAGE_STATUSES,
    types: PACKAGE_TYPES,
    success: trimText(req.query.success) || null,
    error: trimText(req.query.error) || null
  });
});

// Declared before '/packages/:id' so "create" is not read as an ID.
router.get('/packages/create', (req,res) =>{
  return renderPackageForm(res);
});

router.post('/packages', (req, res) => {
  const trackingNo = trimText(req.body.trackingNo);
  const recipientName = trimText(req.body.recipientName);
  const recipientPhone = trimText(req.body.recipientPhone);
  const customerId = trimText(req.body.customerId);
  const weight = Number(req.body.weight);
  const type = trimText(req.body.type);

  const users = readJson('users.json', []);
  const packages = readJson('packages.json', []);

  // Collect every problem at once, so the user sees them all together.
  const errors = [];
  if (!trackingNo) {
    errors.push('Tracking number is required.');
  } else if (packages.some((p) => p.trackingNo.toLowerCase() === trackingNo.toLowerCase())) {
    errors.push('That tracking number is already in use.');
  }
  if (!recipientName) {
    errors.push('Recipient name is required.');
  }
  if (!recipientPhone) {
    errors.push('Recipient phone is required.');
  }
  const customer = users.find((user) => user.id === customerId && user.role === 'customer');
  if (!customer) {
    errors.push('Choose a customer.');
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    errors.push('Weight must be a positive number.');
  }
  if (!PACKAGE_TYPES.includes(type)) {
    errors.push('Choose a valid parcel type.');
  }

  if (errors.length > 0) {
    return renderPackageForm(res, { error: errors.join(' ') });
  }

  const parcel = createParcel(packages, {
    trackingNo,
    recipientName,
    recipientPhone,
    customerId,
    weight,
    type
  });
  packages.push(parcel);
  writeJson('packages.json', packages);

  addTracking(parcel.id, 'Arrived', 'Parcel received at the station.');
  logAction(global.currentUser, 'RECEIVE', `Received parcel ${parcel.trackingNo}.`);

  return res.redirect('/staff/packages');
});

router.post('/packages/batch', (req, res) => {
  const customerId = trimText(req.body.customerId);
  const raw = String(req.body.batch || '');
  const users = readJson('users.json', []);
  const packages = readJson('packages.json', []);

  // One shared customer for the whole batch.
  const customer = users.find((user) => user.id === customerId && user.role === 'customer');
  if (!customer) {
    return renderPackageForm(res, { error: 'Choose a customer for the batch.' });
  }

  // Split the textarea into rows, one parcel per row.
  const rows = raw.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');

  let created = 0;
  let skipped = 0;

  rows.forEach((row) => {
    // Accept "|" or comma as the separator.
    const parts = row.split(/[|,]/).map((part) => part.trim());
    const [trackingNo, recipientName, recipientPhone, weightText, typeRaw] = parts;

    const weight = Number(weightText);
    const type = trimText(typeRaw) || 'Parcel';   // missing type defaults to Parcel

    // Skip this row instead of crashing the whole request.
    if (!trackingNo || !recipientName || !recipientPhone) {
      skipped += 1;
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      skipped += 1;
      return;
    }
    if (packages.some((p) => p.trackingNo.toLowerCase() === trackingNo.toLowerCase())) {
      skipped += 1;
      return;
    }
    if (!PACKAGE_TYPES.includes(type)) {
      skipped += 1;
      return;
    }

    const parcel = createParcel(packages, {
      trackingNo,
      recipientName,
      recipientPhone,
      customerId,
      weight,
      type
    });
    packages.push(parcel);
    addTracking(parcel.id, 'Arrived', 'Parcel received at the station.');
    created += 1;
  });

  writeJson('packages.json', packages);
  logAction(global.currentUser, 'RECEIVE_BATCH', `Batch received: ${created} created, ${skipped} skipped.`);

  const report = `${created} parcels created, ${skipped} skipped.`;
  return res.redirect(`/staff/packages?success=${encodeURIComponent(report)}`);
});

router.get('/packages/:id', (req, res) => {
  const packages = readJson('packages.json', []);
  const parcel = packages.find((item) => item.id === req.params.id);

  if (!parcel) {
    return res.status(404).render('error', {
      title: 'Parcel not found',
      status: 404,
      message: 'The requested parcel does not exist.'
    });
  }

  const tracking = readJson('tracking.json', [])
    .filter((event) => event.packageId === parcel.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const shelves = readJson('shelves.json', [])
    .filter((shelf) => shelf.status === 'Active' && shelf.used < shelf.capacity)
    .sort((left, right) => left.code.localeCompare(right.code));

  return res.render('staff/package-detail', {
    title: 'Parcel ' + parcel.trackingNo,
    parcel,
    tracking,
    shelves,
    canShelve: canShelve(parcel.status),
    canNotify: canNotify(parcel.status),
    canPickup: canPickup(parcel.status),
    canReportException: canReportException(parcel.status),
    success: trimText(req.query.success) || '',
    error: trimText(req.query.error) || ''
  });
});

router.post('/packages/:id/shelf', (req, res) => {
  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);
  const parcel = packages.find((item) => item.id === req.params.id);
  const shelf = shelves.find((item) => item.id === trimText(req.body.shelfId));

  if (!parcel) {
    return res.status(404).render('error', { title: 'Parcel not found', status: 404, message: 'The requested parcel does not exist.' });
  }

  if (!canShelve(parcel.status)) {
    return res.redirect('/staff/packages/' + parcel.id + '?error=' + encodeURIComponent('Parcel cannot be shelved in its current status.'));
  }

  // A parcel can only use an active shelf with free capacity.
  if (!shelf || shelf.status !== 'Active' || shelf.used >= shelf.capacity) {
    return res.redirect('/staff/packages/' + parcel.id + '?error=' + encodeURIComponent('Select an available active shelf.'));
  }

  parcel.shelfId = shelf.id;
  parcel.pickupCode = generatePickupCode(packages.map((item) => item.pickupCode).filter(Boolean));
  parcel.status = 'Shelved';
  parcel.shelvedAt = new Date().toISOString();
  shelf.used += 1;

  writeJson('packages.json', packages);
  writeJson('shelves.json', shelves);
  addTracking(parcel.id, 'Shelved', 'Placed on shelf ' + shelf.code + '. Pickup code ' + parcel.pickupCode + '.');
  logAction(global.currentUser, 'PACKAGE_SHELVED', parcel.trackingNo + ' placed on ' + shelf.code + '.');

  return res.redirect('/staff/packages/' + parcel.id + '?success=' + encodeURIComponent('Parcel shelved and pickup code generated.'));
});

router.post('/packages/:id/notify', (req, res) => {
  const packages = readJson('packages.json', []);
  const parcel = packages.find((item) => item.id === req.params.id);

  if (!parcel) {
    return res.status(404).render('error', { title: 'Parcel not found', status: 404, message: 'The requested parcel does not exist.' });
  }

  // Notification is only valid after a shelf assignment created a pickup code.
  if (!canNotify(parcel.status) || !parcel.pickupCode) {
    return res.redirect('/staff/packages/' + parcel.id + '?error=' + encodeURIComponent('Parcel cannot be notified in its current status.'));
  }

  const notifications = readJson('notifications.json', []);
  const alreadyNotified = notifications.some((item) => item.packageId === parcel.id);
  const config = readJson('config.json', { notificationTemplate: 'Parcel {{trackingNo}} is ready. Pickup code: {{pickupCode}}' });
  const content = renderNotification(config.notificationTemplate, {
    siteName: config.siteName || 'Cainiao Post HK',
    trackingNo: parcel.trackingNo,
    pickupCode: parcel.pickupCode,
    name: parcel.recipientName
  });

  if (!alreadyNotified) {
    notifications.push({
      id: nextId('NOT', notifications),
      userId: parcel.customerId,
      packageId: parcel.id,
      title: 'Parcel ready for pickup: ' + parcel.trackingNo,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    writeJson('notifications.json', notifications);
  }

  parcel.status = 'Notified';
  parcel.notifiedAt = new Date().toISOString();
  writeJson('packages.json', packages);
  addTracking(parcel.id, 'Notified', 'Pickup notification generated with code ' + parcel.pickupCode + '.');
  logAction(global.currentUser, 'PACKAGE_NOTIFIED', parcel.trackingNo + ' pickup notification generated.');

  return res.redirect('/staff/packages/' + parcel.id + '?success=' + encodeURIComponent('Pickup notification generated.'));
});

router.post('/packages/:id/pickup', (req, res) => {
  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);
  const parcel = packages.find((item) => item.id === req.params.id);

  if (!parcel) {
    return res.status(404).render('error', { title: 'Parcel not found', status: 404, message: 'The requested parcel does not exist.' });
  }

  // Pickup is a guarded transition, not a direct status edit.
  if (!canPickup(parcel.status)) {
    return res.redirect('/staff/packages/' + parcel.id + '?error=' + encodeURIComponent('Parcel must be notified before pickup.'));
  }

  parcel.status = 'Picked Up';
  parcel.pickedUpAt = new Date().toISOString();

  if (parcel.shelfId) {
    const shelf = shelves.find((item) => item.id === parcel.shelfId);
    if (shelf && shelf.used > 0) shelf.used -= 1;
    writeJson('shelves.json', shelves);
  }

  writeJson('packages.json', packages);
  addTracking(parcel.id, 'Picked Up', 'Parcel handed to the customer.');
  logAction(global.currentUser, 'PACKAGE_PICKED_UP', parcel.trackingNo + ' picked up.');

  return res.redirect('/staff/packages/' + parcel.id + '?success=' + encodeURIComponent('Parcel marked as picked up.'));
});

// ------------------------------------------------------------------ shelves
router.get('/shelves', (req, res) => {
  const shelves = readJson('shelves.json', [])
    .map((shelf) => ({
      ...shelf,
      usagePercent: Math.round((shelf.used / shelf.capacity) * 100)
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
  return res.render('staff/shelves', {
    title: 'Shelf management',
    shelves,
    success: trimText(req.query.success) || '',
    error: trimText(req.query.error) || ''
  });
});

router.post('/shelves', (req, res) => {
  const shelves = readJson('shelves.json', []);
  const code = trimText(req.body.code).toUpperCase();
  const cabinet = trimText(req.body.cabinet);
  const capacity = Number(req.body.capacity);

  if (!code || !cabinet || !Number.isInteger(capacity) || capacity < 1) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Complete all shelf fields with a positive capacity.'));
  }

  if (shelves.some((shelf) => shelf.code.toLowerCase() === code.toLowerCase())) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('A shelf with that code already exists.'));
  }

  shelves.push({ id: nextId('SHELF', shelves), code, cabinet, capacity, used: 0, status: 'Active' });
  writeJson('shelves.json', shelves);
  logAction(global.currentUser, 'SHELF_CREATED', code + ' added with capacity ' + capacity + '.');
  return res.redirect('/staff/shelves?success=' + encodeURIComponent('Shelf created.'));
});

router.post('/shelves/:id/status', (req, res) => {
  const shelves = readJson('shelves.json', []);
  const shelf = shelves.find((item) => item.id === req.params.id);

  if (!shelf) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Shelf not found.'));
  }

  // Do not hide occupied shelves behind a maintenance state.
  if (shelf.status === 'Active' && shelf.used > 0) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('An occupied shelf cannot enter maintenance.'));
  }

  shelf.status = shelf.status === 'Active' ? 'Maintenance' : 'Active';
  writeJson('shelves.json', shelves);
  logAction(global.currentUser, 'SHELF_STATUS_CHANGED', shelf.code + ' is now ' + shelf.status + '.');
  return res.redirect('/staff/shelves?success=' + encodeURIComponent('Shelf status updated.'));
});

// --------------------------------------------------------------- exceptions
router.get('/exceptions', (req, res) => {
  const exceptions = readJson('exceptions.json', []);
  const packages = readJson('packages.json', []);
  const packageById = new Map(packages.map((parcel) => [parcel.id, parcel]));
  const items = exceptions
    .map((exception) => ({ ...exception, parcel: packageById.get(exception.packageId) }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return res.render('staff/exceptions', {
    title: 'Exception parcels',
    exceptions: items,
    eligiblePackages: packages.filter((parcel) => canReportException(parcel.status)),
    selectedPackageId: trimText(req.query.packageId),
    error: trimText(req.query.error) || '',
    success: trimText(req.query.success) || ''
  });
});

router.post('/exceptions', (req, res) => {
  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);
  const exceptions = readJson('exceptions.json', []);
  const packageId = trimText(req.body.packageId);
  const type = trimText(req.body.type);
  const description = trimText(req.body.description);
  const parcel = packages.find((item) => item.id === packageId);

  if (!parcel) {
    return res.redirect('/staff/exceptions?error=' + encodeURIComponent('Parcel not found.'));
  }

  if (!type || !description) {
    return res.redirect('/staff/exceptions?packageId=' + encodeURIComponent(packageId) + '&error=' + encodeURIComponent('Type and description are required.'));
  }

  // Only parcels still in the normal flow can enter the exception workflow.
  if (!canReportException(parcel.status)) {
    return res.redirect('/staff/exceptions?packageId=' + encodeURIComponent(packageId) + '&error=' + encodeURIComponent('Parcel cannot enter the exception flow.'));
  }

  parcel.previousStatus = parcel.status;
  if (parcel.shelfId) {
    const shelf = shelves.find((item) => item.id === parcel.shelfId);
    if (shelf && shelf.used > 0) shelf.used -= 1;
  }
  parcel.status = 'Exception';

  const now = new Date().toISOString();
  exceptions.push({
    id: nextId('EXC', exceptions),
    packageId: parcel.id,
    type,
    description,
    status: 'Open',
    reportedBy: global.currentUser.id,
    createdAt: now,
    resolvedAt: null
  });

  writeJson('packages.json', packages);
  writeJson('shelves.json', shelves);
  writeJson('exceptions.json', exceptions);
  addTracking(parcel.id, 'Exception', type + ': ' + description);
  logAction(global.currentUser, 'EXCEPTION_REPORTED', parcel.trackingNo + ': ' + type + '.');

  return res.redirect('/staff/exceptions?success=' + encodeURIComponent('Exception reported.'));
});

router.post('/exceptions/:id/resolve', (req, res) => {
  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);
  const exceptions = readJson('exceptions.json', []);
  let notifications = readJson('notifications.json', []);
  const originalNotificationCount = notifications.length;
  const exception = exceptions.find((item) => item.id === req.params.id);

  if (!exception || exception.status !== 'Open') {
    return res.redirect('/staff/exceptions?error=' + encodeURIComponent('Open exception not found.'));
  }

  const parcel = packages.find((item) => item.id === exception.packageId);
  if (!parcel) {
    return res.redirect('/staff/exceptions?error=' + encodeURIComponent('Linked parcel not found.'));
  }

  const previousStatus = parcel.previousStatus || 'Arrived';
  let restoredShelf = false;

  if (parcel.shelfId && ['Shelved', 'Notified'].includes(previousStatus)) {
    const shelf = shelves.find((item) => item.id === parcel.shelfId);
    if (shelf && shelf.status === 'Active' && shelf.used < shelf.capacity) {
      shelf.used += 1;
      restoredShelf = true;
    }
  }

  // If the original shelf is unavailable, remove state that can no longer be used.
  if (!restoredShelf) {
    parcel.shelfId = null;
    parcel.pickupCode = null;
    notifications = notifications.filter((notification) => notification.packageId !== parcel.id);
  }

  parcel.status = restoredShelf ? previousStatus : 'Arrived';
  delete parcel.previousStatus;
  exception.status = 'Resolved';
  exception.resolvedAt = new Date().toISOString();

  writeJson('packages.json', packages);
  writeJson('shelves.json', shelves);
  writeJson('exceptions.json', exceptions);
  if (notifications.length !== originalNotificationCount) {
    writeJson('notifications.json', notifications);
  }
  addTracking(
    parcel.id,
    parcel.status,
    restoredShelf ? 'Exception resolved. Parcel restored to ' + parcel.status + '.' : 'Exception resolved. Parcel returned to intake.'
  );
  logAction(global.currentUser, 'EXCEPTION_RESOLVED', parcel.trackingNo + ': ' + exception.type + '.');

  return res.redirect('/staff/exceptions?success=' + encodeURIComponent('Exception resolved.'));
});

module.exports = router;
