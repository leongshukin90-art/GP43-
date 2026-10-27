// Authentication module — OWNER: backend-auth.
//
// This module is already working so the team can sign in from day one.
// Keep it small: it checks credentials against data/users.json and remembers
// the signed-in user in memory. There is deliberately no cookie, session,
// token, or password hashing here.

const express = require('express');

const { readJson } = require('../utils/db');       // Reads users.json for the credential check.
const { logAction } = require('../utils/logger');  // Records login and logout in logs.json.
const { roleHome } = require('../utils/navigation');
const { trimText } = require('../utils/request');

const router = express.Router();

// Accounts offered as one-click buttons on the login page, one per role.
// Keep this list in step with data/users.json. See the /demo/login route below.
const DEMO_ACCOUNTS = ['staff01', 'admin01', 'cust01'];

/**
 * Turns the demo username list into display data for the login page.
 * Users missing from data/users.json are skipped instead of breaking the page.
 */
function demoAccountsFor(users) {
  return DEMO_ACCOUNTS
    .map((username) => users.find((candidate) => candidate.username === username))
    .filter(Boolean)
    .map((user) => ({ username: user.username, name: user.name, role: user.role }));
}

/**
 * Renders the login page. Every failure path goes through here so the demo
 * buttons and the error message can never drift apart.
 */
function renderLogin(res, options = {}) {
  const users = readJson('users.json', []);

  return res.status(options.status || 200).render('auth/login', {
    title: 'Sign in',
    hideNavigation: true,
    error: options.error || null,
    username: options.username || '',
    demoAccounts: demoAccountsFor(users)
  });
}

// Show the login form. A signed-in user is sent straight to their role home.
router.get('/login', (req, res) => {
  if (global.currentUser) {
    return res.redirect(roleHome(global.currentUser));
  }

  return renderLogin(res);
});

// Compare plain-text credentials and keep the matching user in memory.
router.post('/login', (req, res) => {
  const username = trimText(req.body.username);
  const password = String(req.body.password || '');
  const users = readJson('users.json', []);

  // Username and password must match the same record.
  const user = users.find((candidate) => candidate.username === username && candidate.password === password);

  if (!user) {
    // Reply 401 and re-render the form instead of throwing.
    return renderLogin(res, {
      status: 401,
      error: 'Invalid username or password.',
      username
    });
  }

  // Store a copy in memory; no cookie, session, or token is used.
  global.currentUser = { ...user };
  logAction(user, 'LOGIN', 'User signed in.');
  return res.redirect(roleHome(user));
});

// ---------------------------------------------------------------------------
// Prototype helper: one-click sign-in for classroom demos.
//
// The login page has a fast button per role, and this is what those buttons
// post to. It deliberately does NOT check a password, so it is restricted to
// the accounts in DEMO_ACCOUNTS above.
//
// Delete this route (and the quick sign-in box in views/auth/login.hbs) once
// the demo is over: it signs in as any listed account without credentials.
// ---------------------------------------------------------------------------
router.post('/demo/login', (req, res) => {
  const username = trimText(req.body.username);
  const users = readJson('users.json', []);
  const user = DEMO_ACCOUNTS.includes(username)
    ? users.find((candidate) => candidate.username === username)
    : null;

  if (!user) {
    return renderLogin(res, {
      status: 404,
      error: 'That demo account does not exist. Use the form to sign in.'
    });
  }

  global.currentUser = { ...user };
  logAction(user, 'LOGIN', 'Demo quick sign-in.');
  return res.redirect(roleHome(user));
});

// Logout clears the single in-memory user.
router.get('/logout', (req, res) => {
  if (global.currentUser) {
    logAction(global.currentUser, 'LOGOUT', 'User signed out.');
  }

  // Clearing this value signs out every route guarded by requireAuth.
  global.currentUser = null;
  return res.redirect('/login');
});

module.exports = router;
