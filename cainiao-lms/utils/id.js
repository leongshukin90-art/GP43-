/**
 * Finds the highest numeric suffix and creates the next readable ID.
 * Example: PKG-1010 becomes PKG-1011.
 */
function nextId(prefix, records) {
  const highest = records.reduce((max, record) => {
    const value = Number(String(record.id || '').replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(4, '0')}`;
}

/**
 * Creates a six-digit pickup code and avoids collisions in the current data set.
 */
function generatePickupCode(existingCodes = []) {
  const codes = new Set(existingCodes.map(String));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!codes.has(code)) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique pickup code.');
}

module.exports = {
  generatePickupCode,
  nextId
};
