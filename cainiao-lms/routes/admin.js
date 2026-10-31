const express = require('express');

const { readJson, writeJson } = require('../utils/db');
const { dateKey, recentDays } = require('../utils/date');
const { nextId } = require('../utils/id');
const { logAction } = require('../utils/logger');
const { PACKAGE_STATUSES } = require('../utils/packageStatus');
const { paginate } = require('../utils/pagination');
const { countByStatus } = require('../utils/parcels');
const { trimText } = require('../utils/request');

const router = express.Router();
const ROLES = ['staff', 'admin', 'customer'];

// Reports use live JSON data but keep the chart itself dependency-free.
router.get('/reports', (req, res) => {
  const packages = readJson('packages.json', []);
  // Aggregate data here; templates should only format values.
  const statusCounts = countByStatus(packages, PACKAGE_STATUSES);
  const typeCounts = packages.reduce((counts, parcel) => {
    counts[parcel.type] = (counts[parcel.type] || 0) + 1;
    return counts;
  }, {});
  // Map each Hong Kong calendar day to its inbound package count.
  const dailyInbound = recentDays(7).map((day) => ({
    ...day,
    count: packages.filter((parcel) => dateKey(parcel.arrivedAt) === day.key).length
  }));
  const maximumDaily = Math.max(1, ...dailyInbound.map((day) => day.count));

  dailyInbound.forEach((day) => {
    day.height = Math.max(8, Math.round((day.count / maximumDaily) * 100));
  });

  res.render('admin/reports', {
    title: 'Reports',
    totalPackages: packages.length,
    totalWeight: packages.reduce((sum, parcel) => sum + Number(parcel.weight || 0), 0),
    statusCounts,
    typeCounts,
    dailyInbound
  });
});

// User directory and search filters.
router.get('/users', (req, res) => {
  const users = readJson('users.json', []);
  const q = trimText(req.query.q).toLowerCase();
  const role = trimText(req.query.role);
  const filtered = users
    .filter((user) => {
      const target = [user.username, user.name, user.phone].join(' ').toLowerCase();
      return (!q || target.includes(q)) && (!role || user.role === role);
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  res.render('admin/users', {
    title: 'User management',
    users: filtered,
    roles: ROLES,
    filters: { q: req.query.q || '', role },
    success: req.query.success || '',
    error: req.query.error || ''
  });
});

// Create an account with a unique username.
router.post('/users', (req, res) => {
  const users = readJson('users.json', []);
  const username = trimText(req.body.username).toLowerCase();
  const password = trimText(req.body.password);
  const name = trimText(req.body.name);
  const role = trimText(req.body.role);
  const phone = trimText(req.body.phone);

  // Validate all fields before touching users.json.
  if (!username || !password || !name || !phone || !ROLES.includes(role)) {
    return res.redirect('/admin/users?error=Complete%20all%20user%20fields.');
  }

  // Usernames are unique without regard to letter casing.
  if (users.some((user) => user.username.toLowerCase() === username)) {
    return res.redirect('/admin/users?error=Username%20already%20exists.');
  }

  users.push({
    id: nextId('USR', users),
    username,
    password,
    name,
    role,
    phone,
    createdAt: new Date().toISOString()
  });
  // Persist the new account, then append the admin audit entry.
  writeJson('users.json', users);
  logAction(global.currentUser, 'USER_CREATED', `${username} created with role ${role}.`);
  return res.redirect('/admin/users?success=User%20created.');
});

// Update profile fields and optionally replace the password.
router.post('/users/:id', (req, res) => {
  const users = readJson('users.json', []);
  const user = users.find((item) => item.id === req.params.id);
  const username = trimText(req.body.username).toLowerCase();
  const name = trimText(req.body.name);
  const role = trimText(req.body.role);
  const phone = trimText(req.body.phone);
  const password = trimText(req.body.password);

  if (!user) {
    return res.redirect('/admin/users?error=User%20not%20found.');
  }

  if (!username || !name || !phone || !ROLES.includes(role)) {
    return res.redirect('/admin/users?error=Complete%20all%20user%20fields.');
  }

  if (users.some((item) => item.id !== user.id && item.username.toLowerCase() === username)) {
    return res.redirect('/admin/users?error=Username%20already%20exists.');
  }

  user.username = username;
  user.name = name;
  user.role = role;
  user.phone = phone;
  if (password) user.password = password;

  // Save profile changes and preserve the old password when the field is empty.
  writeJson('users.json', users);
  logAction(global.currentUser, 'USER_UPDATED', `${user.username} profile updated.`);
  return res.redirect('/admin/users?success=User%20updated.');
});

// Searchable and paginated operation log.
router.get('/logs', (req, res) => {
  const logs = readJson('logs.json', []);
  const q = trimText(req.query.q).toLowerCase();
  const action = trimText(req.query.action);
  const actions = [...new Set(logs.map((entry) => entry.action))].sort();
  // Filter before sorting and paginating so page links keep the same result set.
  const filtered = logs
    .filter((entry) => {
      const target = [entry.username, entry.action, entry.detail].join(' ').toLowerCase();
      return (!q || target.includes(q)) && (!action || entry.action === action);
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  const result = paginate(filtered, {
    page: req.query.page,
    pageSize: 15,
    path: '/admin/logs',
    query: { q: req.query.q || '', action }
  });

  res.render('admin/logs', {
    title: 'Operation logs',
    logs: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    pagination: result.pagination,
    actions,
    filters: { q: req.query.q || '', action }
  });
});

// Configuration affects the shared layout and generated notification text.
router.get('/config', (req, res) => {
  const config = readJson('config.json', {});
  res.render('admin/config', {
    title: 'System configuration',
    config,
    success: req.query.success || '',
    error: req.query.error || ''
  });
});

router.post('/config', (req, res) => {
  const config = {
    siteName: trimText(req.body.siteName),
    siteCode: trimText(req.body.siteCode),
    address: trimText(req.body.address),
    phone: trimText(req.body.phone),
    notificationTemplate: trimText(req.body.notificationTemplate),
    language: trimText(req.body.language)
  };

  if (Object.values(config).some((value) => !value)) {
    return res.redirect('/admin/config?error=Complete%20all%20configuration%20fields.');
  }

  // Configuration values affect the shared layout and future notifications.
  writeJson('config.json', config);
  logAction(global.currentUser, 'CONFIG_UPDATED', 'System configuration updated.');
  return res.redirect('/admin/config?success=Configuration%20saved.');
});

module.exports = router;
