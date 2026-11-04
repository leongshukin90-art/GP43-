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
const { nextId } = require('../utils/id');
const { createParcel } = require('../utils/parcels');
const { PACKAGE_TYPES, canReportException } = require('../utils/packageStatus');
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

// ---------------------------------------------------------------- dashboard
router.get('/dashboard', stubPage({
  owner: 'frontend-staff',
  view: 'staff/dashboard',
  title: 'Staff dashboard',
  needs: ['Total / Arrived / Notified / Exception counts', 'Active shelf count', 'Recent arrivals', 'Quick action links'],
  rules: ['Read-only page: it must not change parcel state.']
}));

// ------------------------------------------------------------------ parcels
router.get('/packages', stubPage({
  owner: 'frontend-staff',
  view: 'staff/packages',
  title: 'Parcels',
  needs: ['Table of parcels', 'Filters: q, status, type', 'Pagination: page'],
  rules: ['Filters must survive paging.', 'Status badge uses text-bg-{{statusClass status}}.']
}));

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

router.get('/packages/:id', stubPage({
  owner: 'frontend-staff',
  view: 'staff/package-detail',
  title: 'Parcel detail',
  needs: ['Parcel fields', 'Tracking timeline (newest first)', 'Only the actions valid for the current status'],
  rules: ['Hide invalid actions in the page AND reject them on the server.']
}));

router.post('/packages/:id/shelf', stubPage({
  owner: 'backend-parcel',
  view: 'staff/package-detail',
  title: 'Assign a shelf',
  needs: ['Require status Arrived', 'Require an Active shelf with free capacity', 'Generate a six-digit pickup code'],
  rules: ['Increment shelf.used only on success.']
}));

router.post('/packages/:id/notify', stubPage({
  owner: 'backend-parcel',
  view: 'staff/package-detail',
  title: 'Generate a pickup notification',
  needs: ['Require status Shelved and an existing pickup code', 'Render the message from config.notificationTemplate'],
  rules: ['Create at most one notification per parcel.']
}));

router.post('/packages/:id/pickup', stubPage({
  owner: 'backend-parcel',
  view: 'staff/package-detail',
  title: 'Confirm pickup',
  needs: ['Require status Notified', 'Release the shelf slot'],
  rules: ['No Arrived-to-Picked-Up shortcut.']
}));

// ------------------------------------------------------------------ shelves
router.get('/shelves', stubPage({
  owner: 'frontend-staff',
  view: 'staff/shelves',
  title: 'Shelves',
  needs: ['Shelf cards: code, cabinet, status, used / capacity', 'Create shelf form', 'Move a shelf to maintenance'],
  rules: ['A shelf with parcels cannot be moved to maintenance.']
}));

router.post('/shelves', stubPage({
  owner: 'backend-parcel',
  view: 'staff/shelves',
  title: 'Create a shelf',
  needs: ['Validate code and capacity', 'Reject a duplicate shelf code'],
  rules: []
}));

router.post('/shelves/:id/status', stubPage({
  owner: 'backend-parcel',
  view: 'staff/shelves',
  title: 'Change shelf status',
  needs: ['Switch between Active and Maintenance'],
  rules: []
}));

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
