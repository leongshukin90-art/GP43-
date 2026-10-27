// Administrator module — OWNER: backend-admin (routes) + frontend-admin (views).
//
// Mounted at /admin by app.js and guarded so only role "admin" gets here.
// All seven routes answer HTTP 501 until they are implemented.

const express = require('express');
const { stubPage } = require('../utils/stub');

const router = express.Router();

// ------------------------------------------------------------------ reports
router.get('/reports', stubPage({
  owner: 'frontend-admin',
  view: 'admin/reports',
  title: 'Reports',
  needs: ['Totals per status', 'Daily inbound chart', 'Recent activity'],
  rules: ['The chart is HTML and CSS only. No chart library is allowed.']
}));

// -------------------------------------------------------------------- users
router.get('/users', stubPage({
  owner: 'frontend-admin',
  view: 'admin/users',
  title: 'Users',
  needs: ['User table', 'Create user form', 'Edit user form'],
  rules: ['Passwords stay plain text in this project; never add hashing without an agreed issue.']
}));

router.post('/users', stubPage({
  owner: 'backend-admin',
  view: 'admin/users',
  title: 'Create a user',
  needs: ['Validate username, name, role, and password', 'Reject a duplicate username'],
  rules: []
}));

router.post('/users/:id', stubPage({
  owner: 'backend-admin',
  view: 'admin/users',
  title: 'Update a user',
  needs: ['Update name, role, phone, and password'],
  rules: []
}));

// --------------------------------------------------------------------- logs
router.get('/logs', stubPage({
  owner: 'frontend-admin',
  view: 'admin/logs',
  title: 'Operation logs',
  needs: ['Log table', 'Search and action filter', 'Pagination'],
  rules: ['Read data/logs.json only; the admin pages must not edit history.']
}));

// ------------------------------------------------------------------- config
router.get('/config', stubPage({
  owner: 'frontend-admin',
  view: 'admin/config',
  title: 'Configuration',
  needs: ['Site fields', 'Notification template', 'Read-only JSON preview'],
  rules: []
}));

router.post('/config', stubPage({
  owner: 'backend-admin',
  view: 'admin/config',
  title: 'Update configuration',
  needs: ['Validate siteName, siteCode, address, phone, notificationTemplate, language'],
  rules: ['Keep the {{placeholders}} in notificationTemplate working.']
}));

module.exports = router;
