const HONG_KONG_TIME_ZONE = 'Asia/Hong_Kong';

function dateParts(value) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: HONG_KONG_TIME_ZONE
  }).formatToParts(new Date(value));
}

/**
 * Converts a timestamp to a Hong Kong calendar day as YYYY-MM-DD.
 */
function dateKey(value) {
  const parts = Object.fromEntries(dateParts(value).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Builds the last N Hong Kong calendar days without depending on host timezone.
 */
function recentDays(count) {
  const [year, month, day] = dateKey(new Date()).split('-').map(Number);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  });

  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    const date = new Date(Date.UTC(year, month - 1, day - offset));
    return {
      key: date.toISOString().slice(0, 10),
      label: formatter.format(date)
    };
  });
}

module.exports = {
  HONG_KONG_TIME_ZONE,
  dateKey,
  recentDays
};
