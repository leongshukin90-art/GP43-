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
  throw new Error('createParcel is not implemented yet (OWNER: backend-parcel).');
}

/**
 * Counts parcels for every allowed lifecycle status.
 *
 * @param {Array} packages all parcels
 * @param {Array} statuses the statuses to count, usually PACKAGE_STATUSES
 * @returns {Object} { Arrived: 2, Shelved: 1, ... }
 */
function countByStatus(packages, statuses) {
  throw new Error('countByStatus is not implemented yet (OWNER: backend-parcel).');
}

module.exports = {
  countByStatus,
  createParcel
};
