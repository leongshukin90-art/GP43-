// Customer module — OWNER: backend-parcel (routes) + frontend-customer (views).
//
// Mounted at /my by app.js and guarded so only role "customer" gets here.
// All three routes answer HTTP 501 until they are implemented.
//
// THE RULE THAT MATTERS MOST: never trust an ID from the query string.
// Every query must be filtered by global.currentUser.id, otherwise a customer
// can read somebody else's parcels by editing the URL.

const express = require('express');
const { stubPage } = require('../utils/stub');

const router = express.Router();

router.get('/packages', stubPage({
  owner: 'frontend-customer',
  view: 'client/packages',
  title: 'My parcels',
  needs: ['Only parcels where customerId equals the signed-in user', 'Search and status filter', 'Pagination'],
  rules: ['Filter by the session user, never by a query parameter.']
}));

router.get('/packages/:id', stubPage({
  owner: 'frontend-customer',
  view: 'client/package-detail',
  title: 'Parcel detail',
  needs: ['Parcel fields', 'Pickup code when one exists', 'Tracking timeline, newest first'],
  rules: ['Return 404 for an unknown parcel and 403 for another customer\'s parcel.']
}));

router.get('/notifications', stubPage({
  owner: 'frontend-customer',
  view: 'client/notifications',
  title: 'Notifications',
  needs: ['Notifications where userId equals the signed-in user', 'Link each one to its parcel'],
  rules: ['Filter by the session user, never by a query parameter.']
}));

module.exports = router;
