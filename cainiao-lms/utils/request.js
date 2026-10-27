/**
 * Normalizes HTML form values before validation or storage.
 * Keeping this in one place avoids treating null, numbers, and padded strings differently.
 */
function trimText(value) {
  return String(value ?? '').trim();
}

module.exports = {
  trimText
};
