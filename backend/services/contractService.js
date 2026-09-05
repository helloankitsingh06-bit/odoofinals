const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const { CONTRACT_STATUS, VALID_CONTRACT_STATUSES } = require('../src/constants');

/**
 * Contract Service
 *
 * Firestore Collection: "contracts"
 * Schema: { id, employeeId, startDate, endDate, wage, salaryStructureId, department, jobPosition, status: "Active"|"Expired"|"Draft", createdAt }
 */
const COLLECTION = 'contracts';

const WRITABLE_FIELDS = [
  'employeeId',
  'startDate',
  'endDate',
  'wage',
  'salaryStructureId',
  'department',
  'jobPosition',
  'status',
];

function pickWritable(body = {}) {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

/**
 * Check if two date ranges overlap.
 * Inclusive comparison: startA <= effectiveEndB AND startB <= effectiveEndA
 * Null / undefined / empty string end date is treated as open-ended (Infinity).
 */
function rangesOverlap(startA, endA, startB, endB) {
  const normStartA = String(startA);
  const normStartB = String(startB);
  const normEndA = endA ? String(endA) : null;
  const normEndB = endB ? String(endB) : null;

  const aLeqB = normEndB === null || normStartA <= normEndB;
  const bLeqA = normEndA === null || normStartB <= normEndA;

  return aLeqB && bLeqA;
}

/**
 * Validate contract field format and values.
 */
function validateContractFields(payload, isUpdate = false) {
  if (!isUpdate || payload.employeeId !== undefined) {
    if (!payload.employeeId || typeof payload.employeeId !== 'string' || !payload.employeeId.trim()) {
      const err = new Error('Field "employeeId" is required');
      err.statusCode = 400;
      throw err;
    }
  }

  if (!isUpdate || payload.startDate !== undefined) {
    if (!payload.startDate || typeof payload.startDate !== 'string' || !payload.startDate.trim()) {
      const err = new Error('Field "startDate" is required (format: YYYY-MM-DD)');
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_CONTRACT_STATUSES.includes(payload.status)) {
      const err = new Error(
        `Field "status" must be one of: ${VALID_CONTRACT_STATUSES.join(', ')} (received "${payload.status}")`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.wage !== undefined && payload.wage !== null) {
    const numWage = Number(payload.wage);
    if (isNaN(numWage) || numWage < 0) {
      const err = new Error('Field "wage" must be a non-negative number');
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.startDate && payload.endDate) {
    if (String(payload.endDate) < String(payload.startDate)) {
      const err = new Error('Field "endDate" cannot be before "startDate"');
      err.statusCode = 400;
      throw err;
    }
  }
}

/**
 * Helper to compute whether a contract is currently active
 */
function computeIsActive(contract) {
  if (contract.status !== CONTRACT_STATUS.ACTIVE) return false;
  const today = new Date().toISOString().split('T')[0];
  const startDate = contract.startDate ? String(contract.startDate) : '';
  const endDate = contract.endDate ? String(contract.endDate) : null;

  if (startDate && startDate > today) return false;
  if (endDate && endDate < today) return false;
  return true;
}

/**
 * Validate that an active contract does not overlap with any existing active contract for the employee.
 * Must be executed inside a Firestore transaction for concurrency safety.
 */
async function validateNoOverlappingActiveContract(transaction, employeeId, contractData, excludeContractId = null) {
  if (contractData.status !== CONTRACT_STATUS.ACTIVE) {
    return; // Non-Active contracts never conflict
  }

  const query = db
    .collection(COLLECTION)
    .where('employeeId', '==', employeeId)
    .where('status', '==', CONTRACT_STATUS.ACTIVE);

  const snapshot = await transaction.get(query);

  for (const doc of snapshot.docs) {
    if (excludeContractId && doc.id === excludeContractId) {
      continue;
    }

    const existing = doc.data();
    if (
      rangesOverlap(
        contractData.startDate,
        contractData.endDate,
        existing.startDate,
        existing.endDate
      )
    ) {
      const err = new Error(
        `Employee already has an active contract (${doc.id}) overlapping date range ${existing.startDate || ''} to ${existing.endDate || 'ongoing'}`
      );
      err.name = 'ValidationError';
      err.statusCode = 400;
      err.conflictingContractId = doc.id;
      err.conflictingDates = {
        startDate: existing.startDate,
        endDate: existing.endDate || null,
      };
      throw err;
    }
  }
}

/**
 * Create a contract within a transaction with overlap validation.
 */
async function createContract(data = {}) {
  const payload = pickWritable(data);
  validateContractFields(payload, false);

  const newDocRef = db.collection(COLLECTION).doc();
  const now = new Date();

  const doc = {
    employeeId: payload.employeeId.trim(),
    startDate: payload.startDate.trim(),
    endDate: payload.endDate ? payload.endDate.trim() : null,
    wage: payload.wage !== undefined && payload.wage !== null ? Number(payload.wage) : 0,
    salaryStructureId: payload.salaryStructureId ? payload.salaryStructureId.trim() : '',
    department: payload.department ? payload.department.trim() : '',
    jobPosition: payload.jobPosition ? payload.jobPosition.trim() : '',
    status: payload.status || CONTRACT_STATUS.DRAFT,
    createdAt: now,
  };

  await db.runTransaction(async (transaction) => {
    await validateNoOverlappingActiveContract(transaction, doc.employeeId, doc);
    transaction.set(newDocRef, doc);
  });

  const saved = { id: newDocRef.id, ...doc };
  return serializeTimestamps({
    ...saved,
    isActive: computeIsActive(saved),
  });
}

/**
 * List contracts, optionally filtered by employeeId, department, or status.
 * Adds computed `isActive: boolean` to every contract.
 */
async function getContracts(queryOptions = {}) {
  const { employeeId, department, status, page, limit } = queryOptions;

  let query = db.collection(COLLECTION);

  if (employeeId) {
    query = query.where('employeeId', '==', employeeId);
  }
  if (department) {
    query = query.where('department', '==', department);
  }
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  let items = snapshot.docs.map((doc) => {
    const data = doc.data();
    const item = { id: doc.id, ...data };
    return serializeTimestamps({
      ...item,
      isActive: computeIsActive(item),
    });
  });

  // Sort: Active contracts first, then by startDate descending
  items.sort((a, b) => {
    if (a.status === CONTRACT_STATUS.ACTIVE && b.status !== CONTRACT_STATUS.ACTIVE) return -1;
    if (b.status === CONTRACT_STATUS.ACTIVE && a.status !== CONTRACT_STATUS.ACTIVE) return 1;
    return String(b.startDate || '').localeCompare(String(a.startDate || ''));
  });

  // Pagination support if requested
  if (page || limit) {
    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 100;
    const offset = (pageNum - 1) * pageSize;
    return {
      items: items.slice(offset, offset + pageSize),
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: items.length,
        totalPages: Math.ceil(items.length / pageSize) || 1,
      },
    };
  }

  return items;
}

/**
 * Get contract by ID with computed isActive field.
 */
async function getContractById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const item = { id: doc.id, ...data };
  return serializeTimestamps({
    ...item,
    isActive: computeIsActive(item),
  });
}

/**
 * Update contract with atomic transaction and overlap validation.
 */
async function updateContract(id, updates = {}) {
  const ref = db.collection(COLLECTION).doc(id);
  const payload = pickWritable(updates);
  validateContractFields(payload, true);

  let updatedDoc = null;

  await db.runTransaction(async (transaction) => {
    const existingDoc = await transaction.get(ref);
    if (!existingDoc.exists) {
      const err = new Error(`Contract with id "${id}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const current = existingDoc.data();
    const merged = {
      ...current,
      ...payload,
      wage: payload.wage !== undefined ? Number(payload.wage) : current.wage,
      endDate: payload.endDate !== undefined ? (payload.endDate ? payload.endDate.trim() : null) : current.endDate,
    };

    // Re-validate fields after merge
    validateContractFields(merged, false);

    // Validate overlap against other active contracts for the employee
    await validateNoOverlappingActiveContract(transaction, merged.employeeId, merged, id);

    transaction.update(ref, payload);
    updatedDoc = { id, ...merged };
  });

  return serializeTimestamps({
    ...updatedDoc,
    isActive: computeIsActive(updatedDoc),
  });
}

/**
 * Delete a contract
 */
async function deleteContract(id) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;

  await ref.delete();
  return true;
}

module.exports = {
  rangesOverlap,
  createContract,
  getContracts,
  getContractById,
  updateContract,
  deleteContract,
};
