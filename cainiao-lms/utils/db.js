const fs = require('fs');
const path = require('path');

// Every collection is a separate JSON file under data/.
const DATA_DIR = path.join(__dirname, '..', 'data');

function dataPath(fileName) {
  return path.join(DATA_DIR, fileName);
}

/**
 * Reads one JSON collection. Missing files are created with the fallback value.
 */
function readJson(fileName, fallback = []) {
  const file = dataPath(fileName);

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      writeJson(fileName, fallback);
      return fallback;
    }

    throw new Error(`Unable to read ${fileName}: ${error.message}`);
  }
}

/**
 * Writes readable JSON so students can inspect each state change.
 */
function writeJson(fileName, value) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(dataPath(fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

module.exports = {
  readJson,
  writeJson
};
