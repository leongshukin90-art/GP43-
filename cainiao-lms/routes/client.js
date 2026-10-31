// Customer module — OWNER: backend-parcel (routes) + frontend-customer (views).
//
// Mounted at /my by app.js and guarded so only role "customer" gets here.
//
// THE RULE THAT MATTERS MOST: never trust an ID from the query string.
// Every query is filtered by global.currentUser.id, otherwise a customer can
// read somebody else's parcels by editing the URL.

const express = require('express');

const { readJson } = require('../utils/db');
const { PACKAGE_STATUSES } = require('../utils/packageStatus');
const { paginate } = require('../utils/pagination');
const { trimText } = require('../utils/request');

const router = express.Router();

// Customer parcel list: filter to the signed-in user before searching or paging.
router.get('/packages', (req, res) => {
  // Never trust a customerId from the query string; use the signed-in user ID.
  const packages = readJson('packages.json', []);
  const q = trimText(req.query.q).toLowerCase();
  const status = trimText(req.query.status);

  const filtered = packages
    .filter((parcel) => parcel.customerId === global.currentUser.id)
    .filter((parcel) => {
      const target = [parcel.trackingNo, parcel.recipientName, parcel.pickupCode]
        .join(' ').toLowerCase();
      return (!q || target.includes(q)) && (!status || parcel.status === status);
    })
    .sort((left, right) => new Date(right.arrivedAt) - new Date(left.arrivedAt));

  const result = paginate(filtered, {
    page: req.query.page,
    pageSize: 8,
    path: '/my/packages',
    query: { q: req.query.q || '', status }
  });

  return res.render('client/packages', {
    title: 'My parcels',
    packages: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    pagination: result.pagination,
    filters: { q: req.query.q || '', status },
    statuses: PACKAGE_STATUSES
  });
});

// Customers can only open a parcel linked to their own account.
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

  // A manual URL change must not reveal another customer parcel.
  if (parcel.customerId !== global.currentUser.id) {
    return res.status(403).render('error', {
      title: 'Access denied',
      status: 403,
      message: 'You can only view parcels linked to your account.'
    });
  }

  // Load only this parcel events and show the newest event first.
  const tracking = readJson('tracking.json', [])
    .filter((event) => event.packageId === parcel.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return res.render('client/package-detail', {
    title: 'Parcel ' + parcel.trackingNo,
    parcel,
    tracking
  });
});

// Notification inbox joins each message to its parcel for the detail link.
router.get('/notifications', (req, res) => {
  const notifications = readJson('notifications.json', []);
  const packages = readJson('packages.json', []);
  const packageById = new Map(packages.map((parcel) => [parcel.id, parcel]));

  const items = notifications
    .filter((notification) => notification.userId === global.currentUser.id)
    .map((notification) => ({ ...notification, parcel: packageById.get(notification.packageId) }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return res.render('client/notifications', {
    title: 'Notifications',
    notifications: items
  });
});

module.exports = router;
