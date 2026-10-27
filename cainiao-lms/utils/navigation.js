const ROLE_HOME = {
  staff: '/staff/dashboard',
  admin: '/admin/reports',
  customer: '/my/packages'
};

/**
 * Returns the landing page for a role. Authentication and root routing share the map.
 */
function roleHome(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  return ROLE_HOME[role] || '/login';
}

module.exports = {
  roleHome
};
