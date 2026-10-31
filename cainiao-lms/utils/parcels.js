// Parcel domain helpers — OWNER: backend-parcel.
//
// This file is a STUB on purpose. It is the seam where parcel creation and
// parcel statistics belong, so the routes stay readable. Fill it in when you
// implement the parcel lifecycle (see docs/actions_of_roles/backend-parcel).
//
// Keep the exported names unless the manager approves a change: the route
// handlers will call createParcel() and countByStatus().

const { nextId } = require('./id');

/**
 * Creates a parcel in the initial Arrived state.
 * Single intake and batch intake must share this function so records never drift.
 *
 * @param {Array} packages every existing parcel, used to work out the next ID
 * @param {Object} input    trackingNo, recipientName, recipientPhone, customerId, weight, type
 * @returns {Object} a complete parcel record ready to push into data/packages.json
 */
function createParcel(packages, input) {
  const parcel = {
    id: nextId('PKG',packages),
    trackingNo: input.trackingNo,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    customerId: input.customerId,
    shelfId: null,
    pickupCode: null,
    status: 'Arrived',
    weight: input.weight,
    type: input.type,
    arrivedAt: new Date().toISOString(),
    shelvedAt: null,
    notifiedAt: null,
    pickedUpAt: null
  };
  return parcel;
}

/**
 * Counts parcels for every allowed lifecycle status.
 *
 * @param {Array} packages all parcels
 * @param {Array} statuses the statuses to count, usually PACKAGE_STATUSES
 * @returns {Object} { Arrived: 2, Shelved: 1, ... }
 */
function countByStatus(packages, statuses) {
  const stats = {};
  statuses.forEach((status) => {
    stats[status] = 0;
  });
  packages.forEach((parcel) => {
    if (stats[parcel.status] !== undefined){
      stats[parcel.status] += 1;
    }
  });
  return stats;
}

module.exports = {
  countByStatus,
  createParcel
};
