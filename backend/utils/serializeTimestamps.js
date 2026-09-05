/**
 * serializeTimestamps
 *
 * Firestore returns timestamp fields in a few different shapes depending on how
 * the document was written and which SDK read it back:
 *
 *   - Admin SDK Timestamp instances  -> have a .toDate() method
 *   - Plain objects from JSON         -> { _seconds, _nanoseconds }
 *   - Legacy / client shape           -> { seconds, nanoseconds }
 *
 * If you send those straight to the browser you get inconsistent, hard-to-parse
 * values. This helper walks an object (one level deep, plus nested arrays/objects)
 * and converts every timestamp-looking value into a plain ISO 8601 string.
 *
 * Solve this once, up front, and every API response stays predictable.
 */
function isTimestampLike(value) {
  return (
    value instanceof Date ||
    (value &&
      typeof value === 'object' &&
      (typeof value.toDate === 'function' ||
        typeof value._seconds === 'number' ||
        typeof value.seconds === 'number'))
  );
}

function toISO(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  const seconds =
    typeof value._seconds === 'number' ? value._seconds : value.seconds;
  return new Date(seconds * 1000).toISOString();
}

function serializeTimestamps(input) {
  if (Array.isArray(input)) {
    return input.map((item) => serializeTimestamps(item));
  }

  if (!input || typeof input !== 'object') return input;
  if (isTimestampLike(input)) return toISO(input);

  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (isTimestampLike(value)) {
      result[key] = toISO(value);
    } else if (value && typeof value === 'object') {
      result[key] = serializeTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { serializeTimestamps };
