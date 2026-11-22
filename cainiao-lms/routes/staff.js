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
const { nextId, generatePickupCode } = require('../utils/id');
const { createParcel,countByStatus } = require('../utils/parcels');
const { PACKAGE_STATUSES, PACKAGE_TYPES, canShelve, canNotify, canPickup, canReportException, hasFreeCapacity } = require('../utils/packageStatus');
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

// Render the parcel detail page with the variables the view expects.
function renderParcelDetail(res, parcel, options = {}) {
  const tracking = readJson('tracking.json', [])
    .filter((item) => item.packageId === parcel.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => ({ createdAt: item.createdAt, event: item.status, detail: item.description }));

  const shelves = readJson('shelves.json', []);

  return res.render('staff/package-detail', {
    title: 'Parcel detail',
    parcel,
    tracking,
    shelves,
    canShelve: canShelve(parcel.status),
    canNotify: canNotify(parcel.status),
    canPickup: canPickup(parcel.status),
    canReportException: canReportException(parcel.status),
    success: options.success || null,
    error: options.error || null
  });
}

// ---------------------------------------------------------------- dashboard
router.get('/dashboard', (req,res) => {
  const packages = readJson('packages.json',[]);
  const shelves = readJson('shelves.json',[]);
  const counts = countByStatus(packages, PACKAGE_STATUSES);
  const totalPackages = packages.length;
  const activeShelves = shelves.filter((s) => s.status === 'Active').length;
  return res.render('staff/dashboard',{
    title: 'Staff dashboard',
    counts,
    totalPackages,
    activeShelves
  });
});

// ------------------------------------------------------------------ parcels
router.get('/packages',(req,res) => {
  const q = trimText(req.query.q);
  const status = trimText(req.query.status);
  const type = trimText(req.query.type);
  const page = Number(req.query.page) || 1;

  let packages = readJson('packages.json',[]);

  if (q) {
    const keyword = q.toLowerCase();
    packages = packages.filter((p) =>
    (p.trackingNo || '').toLowerCase().includes(keyword) ||
    (p.recipientName || '').toLowerCase().includes(keyword) ||
    (p.recipientPhone || '').toLowerCase().includes(keyword) ||
    (p.pickupCode || '').toLowerCase().includes(keyword)
    );
  }

  if (status) {
    packages = packages.filter((p) => p.status === status);
  }

  if (type) {
    packages = packages.filter((p) => p.type === type);
  }

  const result = paginate(packages,{
    pageSize: 10,
    page,
    query: { q,status, type },
    path: '/staff/packages'
  });

  return res.render('staff/packages',{
    title: 'Parcels',
    packages: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    pagination: result.pagination,
    filters: { q, status, type },
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

router.get('/packages/:id',(req,res) => {
  const packages = readJson('packages.json',[]);
  const parcel = packages.find((p) => p.id === req.params.id);

  if (!parcel) {
    return res.status(404).render ('error',{
      title:'Page not found',
      status:404,
      message: 'Parcel not found.'
    });
  }

  return renderParcelDetail(res,parcel,{
    success:req.query.success || null,
    error: req.query.error || null
  });
});

router.post('/packages/:id/shelf', (req, res) => {
  const packageId = req.params.id;
  const shelfId = trimText(req.body.shelfId);

  const packages = readJson('packages.json', []);
  const shelves = readJson('shelves.json', []);
  const parcel = packages.find((p) => p.id === packageId);
  const shelf = shelves.find((s) => s.id === shelfId);

  if (!parcel) {
    return res.status(404).render('error', {
      title: 'Page not found',
      status: 404,
      message: 'Parcel not found.'
    });
  }

  if (!canShelve(parcel.status)) {
    return renderParcelDetail(res, parcel, { error: 'Only an Arrived parcel can be placed on a shelf.' });
  }
  if (!shelf) {
    return renderParcelDetail(res, parcel, { error: 'Choose a shelf.' });
  }
  if (!hasFreeCapacity(shelf)) {
    return renderParcelDetail(res, parcel, { error: 'That shelf is full or is not active.' });
  }

  parcel.shelfId = shelf.id;
  parcel.pickupCode = generatePickupCode(packages.map((p) => p.pickupCode));
  parcel.status = 'Shelved';
  parcel.shelvedAt = new Date().toISOString();

  shelf.used += 1;

  writeJson('packages.json', packages);
  writeJson('shelves.json', shelves);

  addTracking(packageId, 'Shelved', `Placed on shelf ${shelf.code}. Pickup code ${parcel.pickupCode}.`);
  logAction(global.currentUser, 'SHELVE', `Assigned ${parcel.trackingNo} to shelf ${shelf.code}.`);

  return res.redirect(`/staff/packages/${packageId}`);
});

router.post('/packages/:id/notify', (req,res) => {
  const packageId = req.params.id;

  const packages = readJson('packages.json',[]);
  const parcel = packages.find((p) => p.id === packageId);

  if(!parcel){
    return res.status(404).render('error',{
      title: 'Page not found',
      status:404,
      message:'Parcel not found.'
    });
  }

  if(!canNotify(parcel.status)){
    return renderParcelDetail(res,parcel,{ error: 'Only a Shelved parcel can be notified.'});
  }

  if(!parcel.pickupCode){
    return renderParcelDetail(res,parcel,{ error: 'This parcel has no pickup code yet.'});
  }

  const config = readJson('config.json',{});
  const notifications = readJson('notifications.json',[]);
//check the notificaiton is send or not
  const alreadyNotified = notifications.find((n) => n.packageId === parcel.id);

  if(!alreadyNotified){
    let content = config.notificationTemplate;
    content = content.replaceAll('{{name}}', parcel.recipientName);
    content = content.replaceAll('{{trackingNo}}',parcel.trackingNo);
    content = content.replaceAll('{{siteName}}',config.siteName);
    content = content.replaceAll('{{pickupCode}}',parcel.pickupCode);

    const newNotification = {
      id: nextId('NOT', notifications),
      userId: parcel.customerId,
      packageId: parcel.id,
      title: 'Parcel ready for pickup: '+ parcel.trackingNo,
      content: content,
      isRead: false,
      createAt: new Date().toISOString()
    };

    notifications.push(newNotification);
    writeJson('notifications.json', notifications);
  }

  parcel.status = 'Notified';
  parcel.notifiedAt = new Date().toISOString();
  writeJson('packages.json', packages);

  addTracking(packageId, 'Notified', 'Pickup notification generated with code '+ parcel.pickupCode + '.');
  logAction(global.currentUser,'Notify', 'Notified' + parcel.trackingNo + 'with pickup code ' + parcel.pickupCode + '.');
  return res.redirect('/staff/packages/' + packageId);
});

router.post('/packages/:id/pickup', (req,res) => {
  const packageId = req.params.id;
  //read packages and shelves.find parcel.
  const packages = readJson('packages.json',[]);
  const shelves = readJson('shelves.json',[]);
  const parcel = packages.find((p) => p.id === packageId);

  if(!parcel){
    return res.status(404).render('error',{
      title: 'Page not found',
      status: 404,
      message: 'Parcel not found.'
    });
  }

  if(!canPickup(parcel.status)){
    return renderParcelDetail(res,parcel,{ error: 'Only a Notified parcel can be picked up.'});
  }

  const shelf = shelves.find((s) => s.id === parcel.shelfId);
  if (shelf && shelf.used >0){
    shelf.used -= 1;
  }

  parcel.status = 'Picked Up';
  parcel.pickedUpAt = new Date().toISOString();

  writeJson('packages.json', packages);
  writeJson('shelves.json', shelves);
  addTracking(packageId,'Picked Up', 'Parcel handed to the customer.');
  logAction(global.currentUser, 'PICKUP', 'Picked up ' + parcel.trackingNo + '.');
  return res.redirect('/staff/packages/' + packageId);
});

// ------------------------------------------------------------------ shelves
// ------------------------------------------------------------------ shelves
router.get('/shelves', (req, res) => {
  const shelves = readJson('shelves.json', []);

  return res.render('staff/shelves', {
    title: 'Shelves',
    shelves,
    success: trimText(req.query.success) || null,
    error: trimText(req.query.error) || null
  });
});

router.post('/shelves', (req, res) => {
  const code = trimText(req.body.code);
  const cabinet = trimText(req.body.cabinet);
  const capacity = Number(req.body.capacity);

  const shelves = readJson('shelves.json', []);

  if (!code) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Code is required.'));
  }
  if (shelves.some((s) => s.code === code)) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('That shelf code is already in use.'));
  }
  if (!cabinet) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Cabinet is required.'));
  }
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Capacity must be a positive number.'));
  }

  const newShelf = {
    id: nextId('SHELF', shelves),
    code,
    cabinet,
    capacity,
    used: 0,
    status: 'Active'
  };
  shelves.push(newShelf);
  writeJson('shelves.json', shelves);

  logAction(global.currentUser, 'SHELF_CREATE', 'Created shelf ' + code + '.');
  return res.redirect('/staff/shelves?success=' + encodeURIComponent('Shelf created.'));
});

router.post('/shelves/:id/status', (req, res) => {
  const shelves = readJson('shelves.json', []);
  const shelf = shelves.find((s) => s.id === req.params.id);

  if (!shelf) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('Shelf not found.'));
  }

  if (shelf.status === 'Active' && shelf.used > 0) {
    return res.redirect('/staff/shelves?error=' + encodeURIComponent('A shelf with parcels cannot be moved to maintenance.'));
  }

  if (shelf.status === 'Active') {
    shelf.status = 'Maintenance';
  } else {
    shelf.status = 'Active';
  }
  writeJson('shelves.json', shelves);

  logAction(global.currentUser, 'SHELF_STATUS', 'Changed shelf ' + shelf.code + ' to ' + shelf.status + '.');
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
