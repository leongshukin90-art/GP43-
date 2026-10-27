// Application entry point for the Cainiao LMS project.
//   npm install      install dependencies once
//   npm run dev      start with auto-restart   ->  http://localhost:3000
//
// This file is the FRAMEWORK layer. It is deliberately complete: every team
// member depends on it, so change it only when an issue explicitly says so.
// The feature modules (routes/*, views/*, and the business rules behind them)
// are what the team builds. Every route handler in routes/staff.js,
// routes/client.js, and routes/admin.js answers 501 "not implemented" today.

const path = require('path');                       // Built-in Node module for safe cross-platform file paths.
const express = require('express');                 // Creates the HTTP server and dispatches requests.
const { engine } = require('express-handlebars');   // Renders the .hbs templates.

// Feature routers. Right now they are stubs; each one is owned by a different person.
const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const clientRoutes = require('./routes/client');
const adminRoutes = require('./routes/admin');

// Shared guards and helpers that every feature module is allowed to reuse.
const { requireAuth } = require('./middlewares/auth');
const { requireRole } = require('./middlewares/role');
const { readJson } = require('./utils/db');
const { roleHome } = require('./utils/navigation');
const { statusClass } = require('./utils/packageStatus');

// Session state lives in memory. Restarting the server signs everyone out.
// The project intentionally uses no cookie, session, JWT, or database.
global.currentUser = null;

const app = express();

// .hbs files, the shared layout, the partials, and the view helpers.
const hbs = engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    // Strict equality for role checks, selected options, and conditional buttons.
    eq(left, right) {
      return left === right;
    },
    // Format timestamps in Hong Kong time so every page and report agrees.
    formatDate(value) {
      if (!value) return '—';
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Hong_Kong'
      }).format(new Date(value));
    },
    // Date-only variant for compact table cells.
    formatDateOnly(value) {
      if (!value) return '—';
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeZone: 'Asia/Hong_Kong'
      }).format(new Date(value));
    },
    // Preserve the selected option after a form reload.
    selectedIf(left, right) {
      return left === right ? 'selected' : '';
    },
    // Map a parcel status to a Bootstrap badge color.
    statusClass
  }
});

// Register the template engine and the shared view directory.
app.engine('hbs', hbs);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Request parsing, static assets, and values every rendered page can read.
app.use(express.urlencoded({ extended: true }));         // Parse HTML form bodies into req.body.
app.use(express.static(path.join(__dirname, 'public'))); // Serve CSS and browser JavaScript.
app.use((req, res, next) => {
  // Values placed on res.locals are available inside every Handlebars template.
  res.locals.currentUser = global.currentUser;
  res.locals.currentPath = req.path;
  res.locals.siteConfig = readJson('config.json', { siteName: 'Cainiao Post HK' });
  next();
});

// Send signed-in users to the landing page for their role.
app.get('/', (req, res) => {
  if (!global.currentUser) return res.redirect('/login');
  return res.redirect(roleHome(global.currentUser));
});

// Public routes, then one guarded route group per role.
app.use('/', authRoutes);                                          // Login and logout are public.
app.use('/staff', requireAuth, requireRole('staff'), staffRoutes); // Staff-only pages.
app.use('/my', requireAuth, requireRole('customer'), clientRoutes);// Customers see only their own data.
app.use('/admin', requireAuth, requireRole('admin'), adminRoutes); // Administrator-only pages.

// A consistent 404 page instead of the default Express stack page.
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    status: 404,
    message: 'The page you requested does not exist.'
  });
});

// Express recognises four arguments as an error-handling middleware.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('error', {
    title: 'Server error',
    status: 500,
    message: error.message || 'An unexpected error occurred.'
  });
});

// Start a real listener only when this file is the entry point, so tests and
// tools can require('./app') without opening a port.
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Cainiao LMS running at http://localhost:${port}`);
  });
}

module.exports = app;
