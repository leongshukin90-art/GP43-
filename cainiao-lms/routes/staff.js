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

const router = express.Router();

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
router.get('/packages/create', stubPage({
  owner: 'frontend-staff',
  view: 'staff/package-form',
  title: 'Receive parcels',
  needs: ['Single parcel form', 'Customer dropdown', 'Batch textarea (one "tracking | name | phone | weight | type" row per line)'],
  rules: ['Single form posts to /staff/packages.', 'Batch form posts to /staff/packages/batch.']
}));

router.post('/packages', stubPage({
  owner: 'backend-parcel',
  view: 'staff/package-form',
  title: 'Receive one parcel',
  needs: ['Validate trackingNo, recipientName, recipientPhone, customerId, weight, type', 'Use utils/parcels.js createParcel()', 'Append a tracking event and an operation log'],
  rules: ['Track an invalid submission by re-rendering the form with an error.', 'Never crash on bad input.']
}));

router.post('/packages/batch', stubPage({
  owner: 'backend-parcel',
  view: 'staff/package-form',
  title: 'Receive a batch of parcels',
  needs: ['One parcel per line', 'Accept "|" or comma separators', 'Report created and skipped rows'],
  rules: ['Skip invalid rows without failing the whole request.']
}));

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
