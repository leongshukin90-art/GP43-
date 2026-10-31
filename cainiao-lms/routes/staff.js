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
const { PACKAGE_TYPES } = require('../utils/packageStatus');
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
router.get('/exceptions', stubPage({
  owner: 'frontend-staff',
  view: 'staff/exceptions',
  title: 'Exceptions',
  needs: ['Open and resolved exception lists', 'Report form', 'Resolve action'],
  rules: []
}));

router.post('/exceptions', stubPage({
  owner: 'backend-admin',
  view: 'staff/exceptions',
  title: 'Report an exception',
  needs: ['Require status Arrived, Shelved, or Notified', 'Remember the previous status'],
  rules: []
}));

router.post('/exceptions/:id/resolve', stubPage({
  owner: 'backend-admin',
  view: 'staff/exceptions',
  title: 'Resolve an exception',
  needs: ['Restore the previous status when shelf capacity is available, otherwise return the parcel to Arrived'],
  rules: []
}));

module.exports = router;
