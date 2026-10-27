// Protect a route group by role. This complements requireAuth.
function requireRole(expectedRole) {
  // Return a middleware function that checks the current user's role.
  return function roleGuard(req, res, next) {
    if (!global.currentUser) {
      return res.redirect('/login');
    }
    // If the current user's role does not match the expected role, return a 403 error.
    if (global.currentUser.role !== expectedRole) {
      return res.status(403).render('error', {
        title: 'Access denied',
        status: 403,
        message: 'Your account does not have permission to open this page.'
      });
    }
    // If the current user's role matches the expected role, proceed to the next middleware or route handler.
    return next();
  };
}
// Export the requireRole function for use in other modules.
module.exports = {
  requireRole
};
