const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const { EMPLOYEE_STATUS, VALID_EMPLOYEE_STATUSES } = require('../src/constants');

/**
 * Employee Service
 *
 * Firestore Collection: "employees"
 * Schema: { id, name, department, managerId, jobPosition, workingScheduleId, status: "Active"|"Inactive", createdAt }
 */
const COLLECTION = 'employees';

const WRITABLE_FIELDS = [
  'name',
  'department',
  'managerId',
  'jobPosition',
  'workingScheduleId',
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
 * Validate employee payload
 */
function validateEmployeeData(payload, isUpdate = false) {
  if (!isUpdate || payload.name !== undefined) {
    if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      const err = new Error('Field "name" is required and must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_EMPLOYEE_STATUSES.includes(payload.status)) {
      const err = new Error(
        `Field "status" must be one of: ${VALID_EMPLOYEE_STATUSES.join(', ')} (received "${payload.status}")`
      );
      err.statusCode = 400;
      throw err;
    }
  }
}

/**
 * Create a new employee
 */
async function createEmployee(data = {}) {
  const payload = pickWritable(data);
  validateEmployeeData(payload, false);

  const now = new Date();
  const doc = {
    name: payload.name.trim(),
    department: payload.department ? payload.department.trim() : '',
    managerId: payload.managerId || null,
    jobPosition: payload.jobPosition ? payload.jobPosition.trim() : '',
    workingScheduleId: payload.workingScheduleId || null,
    status: payload.status || EMPLOYEE_STATUS.ACTIVE,
    createdAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

/**
 * List employees with filters, search, and pagination
 * Supported query options:
 *   - department
 *   - managerId
 *   - status ("Active" | "Inactive")
 *   - jobPosition
 *   - search (free-text on name)
 *   - page (1-based), limit (default: 50)
 */
async function getEmployees(queryOptions = {}) {
  const { department, managerId, status, jobPosition, search, page, limit } = queryOptions;

  let query = db.collection(COLLECTION);

  if (department) {
    query = query.where('department', '==', department);
  }
  if (managerId) {
    query = query.where('managerId', '==', managerId);
  }
  if (status) {
    query = query.where('status', '==', status);
  }
  if (jobPosition) {
    query = query.where('jobPosition', '==', jobPosition);
  }

  const snapshot = await query.get();
  let items = snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  // Free-text search on name in memory
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter((emp) => emp.name && emp.name.toLowerCase().includes(q));
  }

  // Sort by name or createdAt
  items.sort((a, b) => {
    if (a.name && b.name) return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 100;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (page || limit) {
    const offset = (pageNum - 1) * pageSize;
    const paginatedItems = items.slice(offset, offset + pageSize);
    return {
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
      },
    };
  }

  return items;
}

/**
 * Get employee by ID
 */
async function getEmployeeById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Update employee
 */
async function updateEmployee(id, updates = {}) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const payload = pickWritable(updates);
  validateEmployeeData(payload, true);

  if (payload.name) payload.name = payload.name.trim();
  if (payload.department !== undefined) payload.department = payload.department ? payload.department.trim() : '';
  if (payload.jobPosition !== undefined) payload.jobPosition = payload.jobPosition ? payload.jobPosition.trim() : '';

  await ref.update(payload);
  const updated = await ref.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() });
}

/**
 * Soft delete an employee (sets status to 'Inactive')
 */
async function deleteEmployee(id) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;

  await ref.update({ status: EMPLOYEE_STATUS.INACTIVE });
  return true;
}

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
