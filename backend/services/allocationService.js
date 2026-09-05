const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Allocation Service (P2 Scope)
 *
 * Firestore collection: "allocations"
 * Schema:
 *   - id: string
 *   - employeeId: string
 *   - timeOffTypeId: string
 *   - allocatedAmount: number (> 0)
 *   - takenAmount: number (default 0)
 *   - remainingAmount: number (derived = allocatedAmount - takenAmount)
 *   - validFrom: Timestamp / ISO string
 *   - validTo: Timestamp / ISO string
 *   - status: "Pending" | "Approved" (exact enum)
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 */
const COLLECTION = 'allocations';

const VALID_STATUSES = ['Pending', 'Approved'];
const HR_ROLES = ['HRManager', 'HRPayrollManager', 'Admin'];

/**
 * Helper to convert inputs to Date
 */
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val._seconds === 'number') return new Date(val._seconds * 1000);
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000);
  return new Date(val);
}

/**
 * Validate input fields for an allocation
 */
function validateAllocationInput(data) {
  const errors = [];

  if (!data.employeeId || typeof data.employeeId !== 'string') {
    errors.push('Field "employeeId" is required.');
  }

  if (!data.timeOffTypeId || typeof data.timeOffTypeId !== 'string') {
    errors.push('Field "timeOffTypeId" is required.');
  }

  const allocated = Number(data.allocatedAmount);
  if (isNaN(allocated) || allocated <= 0) {
    errors.push('Field "allocatedAmount" must be a positive number.');
  }

  if (!data.validFrom) {
    errors.push('Field "validFrom" date is required.');
  }

  if (!data.validTo) {
    errors.push('Field "validTo" date is required.');
  }

  const fromDate = toDate(data.validFrom);
  const toDateVal = toDate(data.validTo);
  if (fromDate && toDateVal && toDateVal < fromDate) {
    errors.push('"validTo" date cannot be earlier than "validFrom" date.');
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Field "status" must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Create a new Allocation
 */
async function createAllocation(data = {}) {
  validateAllocationInput(data);

  const allocatedAmount = Number(data.allocatedAmount);
  const takenAmount = Number(data.takenAmount) || 0;
  const remainingAmount = Math.max(0, allocatedAmount - takenAmount);
  const status = data.status || 'Pending'; // Default to Pending until approved

  const now = new Date();
  const doc = {
    employeeId: data.employeeId,
    timeOffTypeId: data.timeOffTypeId,
    allocatedAmount,
    takenAmount,
    remainingAmount,
    validFrom: toDate(data.validFrom),
    validTo: toDate(data.validTo),
    status,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

/**
 * List allocations with optional filters (employeeId, timeOffTypeId, status)
 */
async function listAllocations({
  employeeId,
  timeOffTypeId,
  status,
  limit = 100,
} = {}) {
  let query = db.collection(COLLECTION);

  if (employeeId) {
    query = query.where('employeeId', '==', employeeId);
  }
  if (timeOffTypeId) {
    query = query.where('timeOffTypeId', '==', timeOffTypeId);
  }
  if (status && VALID_STATUSES.includes(status)) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );
}

/**
 * Get single Allocation by ID
 */
async function getAllocationById(id) {
  if (!id) return null;
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Approve an allocation (Restricted to HRManager+)
 */
async function approveAllocation(id, userRole) {
  if (!HR_ROLES.includes(userRole)) {
    const err = new Error(
      'Forbidden: Only HRManager, HRPayrollManager, or Admin can approve allocations'
    );
    err.statusCode = 403;
    throw err;
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error(`Allocation ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const data = snap.data();
  if (data.status === 'Approved') {
    return serializeTimestamps({ id: snap.id, ...data });
  }

  const now = new Date();
  await docRef.update({
    status: 'Approved',
    updatedAt: now,
  });

  const updatedSnap = await docRef.get();
  return serializeTimestamps({ id: updatedSnap.id, ...updatedSnap.data() });
}

/**
 * Helper: getAvailableBalance(employeeId, timeOffTypeId, asOfDate)
 *
 * Finds all 'Approved' allocations for this employee and timeOffType
 * covering the target date, and returns the total remaining balance.
 */
async function getAvailableBalance(
  employeeId,
  timeOffTypeId,
  asOfDate = new Date()
) {
  if (!employeeId || !timeOffTypeId) {
    return { totalAvailable: 0, allocations: [] };
  }

  const targetDate = toDate(asOfDate) || new Date();

  // Query Approved allocations for employee & timeOffType
  const snapshot = await db
    .collection(COLLECTION)
    .where('employeeId', '==', employeeId)
    .where('timeOffTypeId', '==', timeOffTypeId)
    .where('status', '==', 'Approved')
    .get();

  let totalAvailable = 0;
  const validAllocations = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const from = toDate(data.validFrom);
    const to = toDate(data.validTo);

    // Check validity period
    const isValidPeriod =
      (!from || targetDate >= from) && (!to || targetDate <= to);

    if (isValidPeriod && (data.remainingAmount || 0) > 0) {
      totalAvailable += Number(data.remainingAmount) || 0;
      validAllocations.push({
        id: doc.id,
        ...data,
      });
    }
  }

  return {
    employeeId,
    timeOffTypeId,
    totalAvailable: Math.round(totalAvailable * 100) / 100,
    allocations: serializeTimestamps(validAllocations),
  };
}

/**
 * Delete allocation (Restricted to HRManager+)
 */
async function deleteAllocation(id, userRole) {
  if (!HR_ROLES.includes(userRole)) {
    const err = new Error(
      'Forbidden: Only HRManager, HRPayrollManager, or Admin can delete allocations'
    );
    err.statusCode = 403;
    throw err;
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error(`Allocation ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  await docRef.delete();
  return true;
}

module.exports = {
  COLLECTION,
  VALID_STATUSES,
  createAllocation,
  listAllocations,
  getAllocationById,
  approveAllocation,
  getAvailableBalance,
  deleteAllocation,
  validateAllocationInput,
};
