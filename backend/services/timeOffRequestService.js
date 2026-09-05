const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const { getAvailableBalance } = require('./allocationService');

/**
 * Time Off Request Service (P2 Scope - Core Differentiator Feature)
 *
 * Firestore collection: "timeOffRequests"
 * Schema:
 *   - id: string
 *   - employeeId: string
 *   - timeOffTypeId: string
 *   - startDate: Timestamp / ISO string
 *   - endDate: Timestamp / ISO string
 *   - duration: number (> 0)
 *   - status: "Pending" | "Approved" | "Refused" (exact match)
 *   - reason: string
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 */
const COLLECTION = 'timeOffRequests';
const ALLOCATIONS_COLLECTION = 'allocations';
const TIME_OFF_TYPES_COLLECTION = 'timeOffTypes';

const VALID_STATUSES = ['Pending', 'Approved', 'Refused'];
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
 * Validate request input
 */
function validateRequestInput(data) {
  const errors = [];

  if (!data.employeeId || typeof data.employeeId !== 'string') {
    errors.push('Field "employeeId" is required.');
  }

  if (!data.timeOffTypeId || typeof data.timeOffTypeId !== 'string') {
    errors.push('Field "timeOffTypeId" is required.');
  }

  if (!data.startDate) {
    errors.push('Field "startDate" is required.');
  }

  if (!data.endDate) {
    errors.push('Field "endDate" is required.');
  }

  const startDate = toDate(data.startDate);
  const endDate = toDate(data.endDate);

  if (startDate && endDate && endDate < startDate) {
    errors.push('"endDate" cannot be earlier than "startDate".');
  }

  const duration = Number(data.duration);
  if (isNaN(duration) || duration <= 0) {
    errors.push('Field "duration" must be a positive number.');
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Create a new Time Off Request (status defaults to "Pending")
 */
async function createTimeOffRequest(data = {}) {
  validateRequestInput(data);

  // Verify time off type exists
  const typeDoc = await db
    .collection(TIME_OFF_TYPES_COLLECTION)
    .doc(data.timeOffTypeId)
    .get();

  if (!typeDoc.exists) {
    const err = new Error(`Time Off Type ${data.timeOffTypeId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const timeOffType = typeDoc.data();
  const duration = Number(data.duration);

  // If requiresAllocation is true, check if employee has sufficient available balance upfront
  if (timeOffType.requiresAllocation) {
    const balance = await getAvailableBalance(
      data.employeeId,
      data.timeOffTypeId,
      toDate(data.startDate)
    );

    if (balance.totalAvailable < duration) {
      const err = new Error(
        `Insufficient leave balance. You have ${balance.totalAvailable} ${timeOffType.unit || 'units'} available, but requested ${duration}.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const now = new Date();
  const doc = {
    employeeId: data.employeeId,
    timeOffTypeId: data.timeOffTypeId,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    duration,
    status: 'Pending',
    reason: (data.reason || '').trim(),
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

/**
 * List Time Off Requests with optional filters
 */
async function listTimeOffRequests({
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
 * Get single Time Off Request by ID
 */
async function getTimeOffRequestById(id) {
  if (!id) return null;
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Approve a Time Off Request (CORE FEATURE)
 *
 * Atomically deducts duration from matching Approved Allocation inside a Firestore transaction.
 */
async function approveTimeOffRequest(requestId, userRole) {
  if (!HR_ROLES.includes(userRole)) {
    const err = new Error(
      'Forbidden: Only HRManager, HRPayrollManager, or Admin can approve time off requests.'
    );
    err.statusCode = 403;
    throw err;
  }

  const requestRef = db.collection(COLLECTION).doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    const err = new Error(`Time Off Request ${requestId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const requestData = requestSnap.data();

  if (requestData.status !== 'Pending') {
    const err = new Error(
      `Cannot approve a request with status "${requestData.status}". Only "Pending" requests can be approved.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Fetch Time Off Type
  const typeDoc = await db
    .collection(TIME_OFF_TYPES_COLLECTION)
    .doc(requestData.timeOffTypeId)
    .get();

  if (!typeDoc.exists) {
    const err = new Error(
      `Time Off Type ${requestData.timeOffTypeId} not found.`
    );
    err.statusCode = 404;
    throw err;
  }

  const timeOffType = typeDoc.data();
  const duration = Number(requestData.duration);
  const now = new Date();

  // If requiresAllocation === false, simple status flip
  if (!timeOffType.requiresAllocation) {
    await requestRef.update({
      status: 'Approved',
      updatedAt: now,
    });
    const updated = await requestRef.get();
    return serializeTimestamps({ id: updated.id, ...updated.data() });
  }

  // If requiresAllocation === true: Find matching Approved allocation
  const reqStart = toDate(requestData.startDate);
  const reqEnd = toDate(requestData.endDate);

  const allocSnapshot = await db
    .collection(ALLOCATIONS_COLLECTION)
    .where('employeeId', '==', requestData.employeeId)
    .where('timeOffTypeId', '==', requestData.timeOffTypeId)
    .where('status', '==', 'Approved')
    .get();

  if (allocSnapshot.empty) {
    const err = new Error(
      `Approval rejected: No approved allocation found for employee ${requestData.employeeId} and time off type ${requestData.timeOffTypeId}.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Pick allocation covering the request period with sufficient remaining balance
  let matchingAllocationDoc = null;

  for (const doc of allocSnapshot.docs) {
    const alloc = doc.data();
    const validFrom = toDate(alloc.validFrom);
    const validTo = toDate(alloc.validTo);

    const coversPeriod =
      (!validFrom || reqStart >= validFrom) && (!validTo || reqEnd <= validTo);

    if (coversPeriod && (alloc.remainingAmount || 0) >= duration) {
      matchingAllocationDoc = doc;
      break;
    }
  }

  // If no single allocation strictly covered the full date range, check if any unexpired approved allocation has enough balance
  if (!matchingAllocationDoc) {
    for (const doc of allocSnapshot.docs) {
      const alloc = doc.data();
      const validTo = toDate(alloc.validTo);
      const isNotExpired = !validTo || reqStart <= validTo;

      if (isNotExpired && (alloc.remainingAmount || 0) >= duration) {
        matchingAllocationDoc = doc;
        break;
      }
    }
  }

  if (!matchingAllocationDoc) {
    const err = new Error(
      `Approval rejected: Insufficient allocation balance for employee ${requestData.employeeId}. Duration requested: ${duration}.`
    );
    err.statusCode = 400;
    throw err;
  }

  const matchingAllocationRef = db
    .collection(ALLOCATIONS_COLLECTION)
    .doc(matchingAllocationDoc.id);

  // Execute inside Firestore transaction for 100% atomicity and race prevention
  let resultAllocationData = null;
  let resultRequestData = null;

  await db.runTransaction(async (transaction) => {
    // 1. Re-read request
    const freshRequest = await transaction.get(requestRef);
    if (!freshRequest.exists) {
      throw new Error(`Time Off Request ${requestId} not found in transaction`);
    }
    const currentReq = freshRequest.data();
    if (currentReq.status !== 'Pending') {
      throw new Error(
        `Request status changed to "${currentReq.status}". Transaction aborted.`
      );
    }

    // 2. Re-read allocation
    const freshAlloc = await transaction.get(matchingAllocationRef);
    if (!freshAlloc.exists) {
      throw new Error('Allocation not found in transaction');
    }

    const currentAlloc = freshAlloc.data();
    if (currentAlloc.status !== 'Approved') {
      throw new Error('Allocation is no longer Approved');
    }

    const currentRemaining = Number(currentAlloc.remainingAmount) || 0;
    if (currentRemaining < duration) {
      throw new Error(
        `Insufficient remaining balance. Available: ${currentRemaining}, required: ${duration}`
      );
    }

    // 3. Atomically compute new values
    const currentTaken = Number(currentAlloc.takenAmount) || 0;
    const allocatedAmount = Number(currentAlloc.allocatedAmount) || 0;
    const newTaken = currentTaken + duration;
    const newRemaining = Math.max(0, allocatedAmount - newTaken);

    // 4. Update allocation
    transaction.update(matchingAllocationRef, {
      takenAmount: newTaken,
      remainingAmount: newRemaining,
      updatedAt: now,
    });

    // 5. Update request status to Approved
    transaction.update(requestRef, {
      status: 'Approved',
      updatedAt: now,
    });

    resultAllocationData = {
      id: matchingAllocationRef.id,
      ...currentAlloc,
      takenAmount: newTaken,
      remainingAmount: newRemaining,
      updatedAt: now,
    };

    resultRequestData = {
      id: requestRef.id,
      ...currentReq,
      status: 'Approved',
      updatedAt: now,
    };
  });

  return {
    request: serializeTimestamps(resultRequestData),
    allocation: serializeTimestamps(resultAllocationData),
  };
}

/**
 * Refuse a Time Off Request (Restricted to HRManager+)
 */
async function refuseTimeOffRequest(requestId, userRole, reason = '') {
  if (!HR_ROLES.includes(userRole)) {
    const err = new Error(
      'Forbidden: Only HRManager, HRPayrollManager, or Admin can refuse time off requests.'
    );
    err.statusCode = 403;
    throw err;
  }

  const requestRef = db.collection(COLLECTION).doc(requestId);
  const snap = await requestRef.get();

  if (!snap.exists) {
    const err = new Error(`Time Off Request ${requestId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const current = snap.data();
  if (current.status !== 'Pending') {
    const err = new Error(
      `Cannot refuse a request with status "${current.status}". Only "Pending" requests can be refused.`
    );
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const updates = {
    status: 'Refused',
    updatedAt: now,
  };
  if (reason) {
    updates.refusalReason = reason;
  }

  await requestRef.update(updates);
  const updated = await requestRef.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() });
}

/**
 * Delete a Time Off Request (Only pending or by HRManager+)
 */
async function deleteTimeOffRequest(requestId, userRole, userId) {
  const requestRef = db.collection(COLLECTION).doc(requestId);
  const snap = await requestRef.get();

  if (!snap.exists) {
    const err = new Error(`Time Off Request ${requestId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const current = snap.data();
  const isHR = HR_ROLES.includes(userRole);

  if (!isHR && current.status !== 'Pending') {
    const err = new Error('Employees can only cancel pending requests.');
    err.statusCode = 403;
    throw err;
  }

  await requestRef.delete();
  return true;
}

module.exports = {
  COLLECTION,
  VALID_STATUSES,
  createTimeOffRequest,
  listTimeOffRequests,
  getTimeOffRequestById,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  deleteTimeOffRequest,
  validateRequestInput,
};
