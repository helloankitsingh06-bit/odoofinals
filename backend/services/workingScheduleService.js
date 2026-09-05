const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const {
  SCHEDULE_TYPES,
  VALID_SCHEDULE_TYPES,
  DAYS_OF_WEEK,
} = require('../src/constants');

/**
 * Working Schedule Service
 *
 * Firestore Collection: "workingSchedules"
 * Schema: { id, name, type, weeklyPattern: [{ day, startTime, endTime, breakMins }], totalWeeklyHours, createdAt }
 */
const COLLECTION = 'workingSchedules';

const WRITABLE_FIELDS = ['name', 'type', 'weeklyPattern'];

function pickWritable(body = {}) {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

/**
 * Parse "HH:MM" or "H:MM" string into minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Calculate total weekly hours from weeklyPattern array.
 * Formula: for each entry, workedMinutes = (endTime - startTime) - breakMins.
 * Throws ValidationError if workedMinutes < 0 or times are invalid.
 */
function calculateTotalWeeklyHours(weeklyPattern = []) {
  if (!Array.isArray(weeklyPattern)) return 0;

  let totalMinutes = 0;

  for (const entry of weeklyPattern) {
    if (!entry || !entry.day) continue;

    // If day is not a working day or times are empty, skip
    if (!entry.startTime || !entry.endTime) continue;

    const startMin = parseTimeToMinutes(entry.startTime);
    const endMin = parseTimeToMinutes(entry.endTime);
    const breakMins = parseInt(entry.breakMins, 10) || 0;

    if (breakMins < 0) {
      const err = new Error(`Break minutes on ${entry.day} cannot be negative`);
      err.statusCode = 400;
      throw err;
    }

    const duration = endMin - startMin;
    if (duration < 0) {
      const err = new Error(
        `End time (${entry.endTime}) cannot be before start time (${entry.startTime}) on ${entry.day}`
      );
      err.statusCode = 400;
      throw err;
    }

    const workedMinutes = duration - breakMins;
    if (workedMinutes < 0) {
      const err = new Error(
        `Break minutes (${breakMins} mins) exceed total shift duration (${duration} mins) on ${entry.day}`
      );
      err.statusCode = 400;
      throw err;
    }

    totalMinutes += workedMinutes;
  }

  // Return hours rounded to 2 decimal places
  return +(totalMinutes / 60).toFixed(2);
}

/**
 * Validate schedule payload
 */
function validateScheduleData(payload, isUpdate = false) {
  if (!isUpdate || payload.name !== undefined) {
    if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      const err = new Error('Field "name" is required');
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.type !== undefined) {
    if (!VALID_SCHEDULE_TYPES.includes(payload.type)) {
      const err = new Error(
        `Field "type" must be one of: ${VALID_SCHEDULE_TYPES.join(', ')} (received "${payload.type}")`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.weeklyPattern !== undefined) {
    if (!Array.isArray(payload.weeklyPattern)) {
      const err = new Error('Field "weeklyPattern" must be an array of daily pattern objects');
      err.statusCode = 400;
      throw err;
    }

    for (const entry of payload.weeklyPattern) {
      if (entry.day && !DAYS_OF_WEEK.includes(entry.day)) {
        const err = new Error(
          `Invalid day "${entry.day}" in weeklyPattern. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

/**
 * Clean and format weekly pattern entries
 */
function sanitizeWeeklyPattern(pattern = []) {
  if (!Array.isArray(pattern)) return [];

  return pattern.map((entry) => ({
    day: entry.day || 'Monday',
    startTime: entry.startTime ? entry.startTime.trim() : '',
    endTime: entry.endTime ? entry.endTime.trim() : '',
    breakMins: parseInt(entry.breakMins, 10) || 0,
  }));
}

/**
 * Create a new working schedule
 */
async function createSchedule(data = {}) {
  const payload = pickWritable(data);
  validateScheduleData(payload, false);

  const pattern = sanitizeWeeklyPattern(payload.weeklyPattern);
  const totalWeeklyHours = calculateTotalWeeklyHours(pattern);

  const now = new Date();
  const doc = {
    name: payload.name.trim(),
    type: payload.type || SCHEDULE_TYPES.FIXED,
    weeklyPattern: pattern,
    totalWeeklyHours,
    createdAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

/**
 * List all working schedules
 */
async function getSchedules() {
  const snapshot = await db.collection(COLLECTION).get();
  const items = snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return items;
}

/**
 * Get working schedule by ID
 */
async function getScheduleById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Update working schedule
 */
async function updateSchedule(id, updates = {}) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const payload = pickWritable(updates);
  validateScheduleData(payload, true);

  const current = existing.data();
  const mergedPattern = payload.weeklyPattern !== undefined
    ? sanitizeWeeklyPattern(payload.weeklyPattern)
    : current.weeklyPattern || [];

  const totalWeeklyHours = calculateTotalWeeklyHours(mergedPattern);

  const updateDoc = {
    ...payload,
    weeklyPattern: mergedPattern,
    totalWeeklyHours,
  };
  if (payload.name) updateDoc.name = payload.name.trim();

  await ref.update(updateDoc);
  const updated = await ref.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() });
}

/**
 * Delete working schedule
 */
async function deleteSchedule(id) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;

  await ref.delete();
  return true;
}

module.exports = {
  calculateTotalWeeklyHours,
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
