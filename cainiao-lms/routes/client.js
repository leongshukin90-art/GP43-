// Customer module — OWNER: backend-parcel (routes) + frontend-customer (views).
//
// Mounted at /my by app.js and guarded so only role "customer" gets here.
// All three routes answer HTTP 501 until they are implemented.
//
// THE RULE THAT MATTERS MOST: never trust an ID from the query string.
// Every query must be filtered by global.currentUser.id, otherwise a customer
// can read somebody else's parcels by editing the URL.

const express = require('express');
const { readJson } = require('../utils/db');
const { paginate } = require('../utils/pagination');
const { PACKAGE_STATUSES } = require('../utils/packageStatus');
const { trimText } = require('../utils/request');

const router = express.Router();

router.get('/packages', (req, res) => {
  const q = trimText(req.query.q);
  const status = trimText(req.query.status);
  const page = Number(req.query.page) || 1;

  let packages = readJson('packages.json', [])
    .filter((p) => p.customerId === global.currentUser.id);

  if (q) {
    const keyword = q.toLowerCase();
    packages = packages.filter((p) => (p.trackingNo || '').toLowerCase().includes(keyword));
  }

  if (status) {
    packages = packages.filter((p) => p.status === status);
  }

  const result = paginate(packages, {
    pageSize: 10,
    page,
    query: { q, status },
    path: '/my/packages'
  });

  return res.render('client/packages', {
    title: 'My parcels',
    packages: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    pagination: result.pagination,
    filters: { q, status },
    statuses: PACKAGE_STATUSES
  });
});

router.get('/packages/:id', (req, res) => {
  const packages = readJson('packages.json', []);
  const parcel = packages.find((p) => p.id === req.params.id);

  if (!parcel) {
    return res.status(404).render('error', {
      title: 'Page not found',
      status: 404,
      message: 'Parcel not found.'
    });
  }

  if (parcel.customerId !== global.currentUser.id) {
    return res.status(403).render('error', {
      title: 'Access denied',
      status: 403,
      message: 'You do not have permission to view this parcel.'
    });
  }

  const tracking = readJson('tracking.json', [])
    .filter((item) => item.packageId === parcel.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.render('client/package-detail', {
    title: 'Parcel detail',
    parcel,
    tracking
  });
});

router.get('/notifications', (req, res) => {
  const notifications = readJson('notifications.json', [])
    .filter((n) => n.userId === global.currentUser.id);

  const packages = readJson('packages.json', []);
  const items = notifications.map((n) => ({
    ...n,
    parcel: packages.find((p) => p.id === n.packageId)
  }));

  return res.render('client/notifications', {
    title: 'Notifications',
    notifications: items
  });
});

module.exports = router;