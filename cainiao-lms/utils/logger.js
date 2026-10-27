const { nextId } = require('./id');
const { readJson, writeJson } = require('./db');

/**
 * Appends one operation log entry for the current in-memory user.
 */
function logAction(user, action, detail) {
  if (!user) {
    return;
  }

  const logs = readJson('logs.json', []);
  logs.push({
    id: nextId('LOG', logs),
    action,
    userId: user.id,
    username: user.username,
    detail,
    createdAt: new Date().toISOString()
  });
  writeJson('logs.json', logs);
}

module.exports = {
  logAction
};
