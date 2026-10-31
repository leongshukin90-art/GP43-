const PACKAGE_STATUSES = ['Arrived', 'Shelved', 'Notified', 'Picked Up', 'Exception'];
const PACKAGE_TYPES = ['Parcel','Document','Fragile','Bulky','Cold Chain'];

// Bootstrap color token for each domain status.
function statusClass(status) {
  const classes = {
    Arrived: 'primary',
    Shelved: 'info',
    Notified: 'warning',
    'Picked Up': 'success',
    Exception: 'danger'
  };

  return classes[status] || 'secondary';
}

// The lifecycle rules live together so route handlers stay easy to compare.
function canReportException(status) {
  return ['Arrived', 'Shelved', 'Notified'].includes(status);
}

function canShelve(status) {
  return status === 'Arrived';
}

function canNotify(status) {
  return status === 'Shelved';
}

function canPickup(status) {
  return status === 'Notified';
}

module.exports = {
  PACKAGE_STATUSES,
  PACKAGE_TYPES,
  canNotify,
  canPickup,
  canReportException,
  canShelve,
  statusClass
};
