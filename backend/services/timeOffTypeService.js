const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Time Off Type Service (P2 Scope)
 *
 * Firestore collection: "timeOffTypes"
 * Schema:
 *   - id: string
 *   - name: string (unique, required)
 *   - unit: "Days" | "Hours" (exact match)
 *   - requiresAllocation: boolean
 *   - requiresApproval: boolean
 *   - payrollIntegrated: boolean
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 */
const COLLECTION = 'timeOffTypes';

const VALID_UNITS = ['Days', 'Hours'];

/**
 * Validate input fields for timeOffType
 */
function validateTimeOffTypeInput(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Field "name" is required and cannot be empty.');
    }
  }

  if (!isUpdate || data.unit !== undefined) {
    if (!VALID_UNITS.includes(data.unit)) {
      errors.push(`Field "unit" must be one of exactly: ${VALID_UNITS.join(', ')}.`);
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Create a new Time Off Type
 */
async function createTimeOffType(data = {}) {
  validateTimeOffTypeInput(data, false);

  const name = data.name.trim();

  // Enforce name uniqueness
  const existingSnapshot = await db
    .collection(COLLECTION)
    .where('name', '==', name)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const err = new Error(`Time Off Type with name "${name}" already exists.`);
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const doc = {
    name,
    unit: data.unit, // Exactly "Days" or "Hours"
    requiresAllocation: Boolean(data.requiresAllocation),
    requiresApproval: Boolean(data.requiresApproval),
    payrollIntegrated: Boolean(data.payrollIntegrated),
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

/**
 * List all Time Off Types
 */
async function getTimeOffTypes() {
  const snapshot = await db.collection(COLLECTION).orderBy('name', 'asc').get();
  return snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );
}

/**
 * Get a single Time Off Type by ID
 */
async function getTimeOffTypeById(id) {
  if (!id) return null;
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Update an existing Time Off Type
 */
async function updateTimeOffType(id, updates = {}) {
  if (!id) {
    const err = new Error('ID is required');
    err.statusCode = 400;
    throw err;
  }

  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    const err = new Error(`Time Off Type ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  validateTimeOffTypeInput(updates, true);

  const payload = {};
  if (updates.name !== undefined) {
    const name = updates.name.trim();
    // Check if another type has this name
    const collisionSnapshot = await db
      .collection(COLLECTION)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!collisionSnapshot.empty && collisionSnapshot.docs[0].id !== id) {
      const err = new Error(`Time Off Type with name "${name}" already exists.`);
      err.statusCode = 400;
      throw err;
    }
    payload.name = name;
  }

  if (updates.unit !== undefined) {
    payload.unit = updates.unit;
  }
  if (updates.requiresAllocation !== undefined) {
    payload.requiresAllocation = Boolean(updates.requiresAllocation);
  }
  if (updates.requiresApproval !== undefined) {
    payload.requiresApproval = Boolean(updates.requiresApproval);
  }
  if (updates.payrollIntegrated !== undefined) {
    payload.payrollIntegrated = Boolean(updates.payrollIntegrated);
  }

  payload.updatedAt = new Date();

  await ref.update(payload);
  const updated = await ref.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() });
}

/**
 * Delete a Time Off Type
 */
async function deleteTimeOffType(id) {
  if (!id) {
    const err = new Error('ID is required');
    err.statusCode = 400;
    throw err;
  }

  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    const err = new Error(`Time Off Type ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  await ref.delete();
  return true;
}

module.exports = {
  COLLECTION,
  VALID_UNITS,
  createTimeOffType,
  getTimeOffTypes,
  getTimeOffTypeById,
  updateTimeOffType,
  deleteTimeOffType,
  validateTimeOffTypeInput,
};
