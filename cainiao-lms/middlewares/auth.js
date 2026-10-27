// Protect pages that require a signed-in user.
function requireAuth(req, res, next) {
  if (!global.currentUser) {
    return res.redirect('/login');
  }

  return next();
}

module.exports = {
  requireAuth
};
