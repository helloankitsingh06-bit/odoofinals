const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const { computePayslip } = require('./payslipComputationEngine');

/**
 * Collection constants in Firestore
 */
const COLLECTIONS = {
  PAYRUNS: 'payruns',
  PAYSLIPS: 'payslips',
  EMPLOYEES: 'employees',
  CONTRACTS: 'contracts',
  ATTENDANCE: 'attendances',
  SALARY_STRUCTURES: 'salary_structures',
  SALARY_RULES: 'salary_rules',
};

/**
 * Shared PAYRUN_STATUS enum discipline
 */
const PAYRUN_STATUS = {
  DRAFT: 'Draft',
  COMPUTED: 'Computed',
  VALIDATED: 'Validated',
  PAID: 'Paid',
};

/**
 * Helper to construct operational errors with HTTP status codes.
 */
function createError(message, statusCode = 400, details = {}) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
}

/**
 * ----------------------------------------------------------------------------
 * STEP 1 -> STEP 2 WIZARD HELPER: ELIGIBLE EMPLOYEES
 * ----------------------------------------------------------------------------
 * Queries eligible employees for a given salaryStructureId and payrun period:
 *   1. Employee status must be "Active"
 *   2. Contract status must be "Active"
 *   3. Contract salaryStructureId must match the chosen structure
 *   4. Contract startDate/endDate must cover the payrun period
 *   5. Employee must NOT have an existing finalized ("Paid") payslip for this period
 *
 * @param {Object} params
 * @param {string} params.salaryStructureId - Selected salary structure ID
 * @param {Object} params.period - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @returns {Promise<Array<Object>>} List of eligible employees with their active contracts
 */
async function getEligibleEmployeesForPayrun({ salaryStructureId, period = {} }) {
  if (!salaryStructureId || typeof salaryStructureId !== 'string') {
    throw createError('Field "salaryStructureId" is required to find eligible employees', 400);
  }
  if (!period.startDate || !period.endDate) {
    throw createError('Field "period" with "startDate" and "endDate" is required', 400);
  }

  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);

  // 1. Fetch active employees
  const empSnapshot = await db
    .collection(COLLECTIONS.EMPLOYEES)
    .where('status', '==', 'Active')
    .get();

  const activeEmployees = empSnapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  if (activeEmployees.length === 0) {
    return [];
  }

  const activeEmpIds = new Set(activeEmployees.map((e) => e.id));

  // 2. Fetch active contracts matching structure
  const contractSnapshot = await db
    .collection(COLLECTIONS.CONTRACTS)
    .where('salaryStructureId', '==', salaryStructureId)
    .where('status', '==', 'Active')
    .get();

  const matchingContracts = contractSnapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  // Map contracts by employeeId, verifying period coverage
  const employeeContractMap = new Map();
  for (const contract of matchingContracts) {
    const empId = contract.employeeId;
    if (!empId || !activeEmpIds.has(empId)) continue;

    // Check date coverage
    const cStart = contract.startDate ? new Date(contract.startDate) : null;
    const cEnd = contract.endDate ? new Date(contract.endDate) : null;

    if (cStart && cStart > periodEnd) continue; // Starts after period
    if (cEnd && cEnd < periodStart) continue;   // Ended before period

    employeeContractMap.set(empId, contract);
  }

  // 3. Exclude employees who already have a paid/finalized payslip for this exact period
  const existingPayslipsSnapshot = await db
    .collection(COLLECTIONS.PAYSLIPS)
    .where('period.startDate', '==', period.startDate)
    .where('period.endDate', '==', period.endDate)
    .where('status', '==', PAYRUN_STATUS.PAID)
    .get();

  const paidEmployeeIds = new Set(
    existingPayslipsSnapshot.docs.map((doc) => doc.data().employeeId)
  );

  // 4. Assemble eligible employees list
  const eligible = [];
  for (const emp of activeEmployees) {
    if (employeeContractMap.has(emp.id) && !paidEmployeeIds.has(emp.id)) {
      eligible.push({
        ...emp,
        activeContract: employeeContractMap.get(emp.id),
      });
    }
  }

  return eligible;
}

/**
 * ----------------------------------------------------------------------------
 * CREATE PAYRUN (Step 2 confirmation -> Draft state)
 * ----------------------------------------------------------------------------
 *
 * @param {Object} data
 * @param {string} data.name - Payrun title (e.g. "September 2026 Payrun")
 * @param {string} data.salaryStructureId - Selected salary structure ID
 * @param {Object} data.period - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @param {Array<string>} data.employeeIds - Selected employee IDs
 * @returns {Promise<Object>} Created Payrun doc in "Draft" status
 */
async function createPayrun(data = {}) {
  const { name, salaryStructureId, period, employeeIds } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError('Field "name" is required for payrun', 400);
  }
  if (!salaryStructureId || typeof salaryStructureId !== 'string') {
    throw createError('Field "salaryStructureId" is required for payrun', 400);
  }
  if (!period || !period.startDate || !period.endDate) {
    throw createError('Field "period" ({ startDate, endDate }) is required for payrun', 400);
  }
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw createError('At least one employee must be selected for payrun', 400);
  }

  // Verify structure exists
  const structDoc = await db.collection(COLLECTIONS.SALARY_STRUCTURES).doc(salaryStructureId).get();
  if (!structDoc.exists) {
    throw createError(`Salary Structure "${salaryStructureId}" does not exist`, 404);
  }

  const now = new Date();
  const payrunDoc = {
    name: name.trim(),
    salaryStructureId,
    period: {
      startDate: period.startDate,
      endDate: period.endDate,
    },
    employeeIds: [...new Set(employeeIds)],
    status: PAYRUN_STATUS.DRAFT,
    totalGross: 0,
    totalNet: 0,
    totalEmployees: employeeIds.length,
    warningSummary: {
      totalWarnings: 0,
      countWithWarnings: 0,
      warnings: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.PAYRUNS).add(payrunDoc);
  return serializeTimestamps({ id: ref.id, ...payrunDoc });
}

/**
 * ----------------------------------------------------------------------------
 * COMPUTE PAYRUN (Draft -> Computed)
 * ----------------------------------------------------------------------------
 * Iterates through employeeIds, computes payslips using Phase 2 engine,
 * stores/overwrites payslips deterministically keyed by `${payrunId}_${employeeId}`,
 * and transitions payrun status to "Computed".
 *
 * @param {string} payrunId - Payrun ID
 * @returns {Promise<Object>} Updated Payrun doc with computed totals
 */
async function computePayrun(payrunId) {
  if (!payrunId || typeof payrunId !== 'string') {
    throw createError('A valid payrunId must be provided', 400);
  }

  const payrunRef = db.collection(COLLECTIONS.PAYRUNS).doc(payrunId);
  const payrunDoc = await payrunRef.get();
  if (!payrunDoc.exists) {
    throw createError(`Payrun "${payrunId}" not found`, 404);
  }

  const payrun = payrunDoc.data();

  // Guard: State transition check
  // Allow compute from "Draft" or re-compute from "Computed"
  if (payrun.status !== PAYRUN_STATUS.DRAFT && payrun.status !== PAYRUN_STATUS.COMPUTED) {
    throw createError(
      `Cannot compute payrun "${payrunId}": invalid status transition from "${payrun.status}" to "${PAYRUN_STATUS.COMPUTED}". Only Draft or Computed payruns can be computed.`,
      400
    );
  }

  // Pre-load salary structure & rules once for batch efficiency
  const structDoc = await db
    .collection(COLLECTIONS.SALARY_STRUCTURES)
    .doc(payrun.salaryStructureId)
    .get();

  if (!structDoc.exists) {
    throw createError(`Salary structure "${payrun.salaryStructureId}" not found`, 404);
  }
  const salaryStructure = serializeTimestamps({ id: structDoc.id, ...structDoc.data() });

  const ruleDocs = await Promise.all(
    (salaryStructure.ruleIds || []).map((rId) =>
      db.collection(COLLECTIONS.SALARY_RULES).doc(rId).get()
    )
  );
  const salaryRules = ruleDocs
    .filter((d) => d.exists)
    .map((d) => serializeTimestamps({ id: d.id, ...d.data() }));

  let totalGross = 0;
  let totalNet = 0;
  const computedPayslips = [];

  for (const empId of payrun.employeeIds) {
    // 1. Fetch Employee
    const empDoc = await db.collection(COLLECTIONS.EMPLOYEES).doc(empId).get();
    const employee = empDoc.exists
      ? serializeTimestamps({ id: empDoc.id, ...empDoc.data() })
      : { id: empId };

    // 2. Fetch active contract for employee
    const contractSnap = await db
      .collection(COLLECTIONS.CONTRACTS)
      .where('employeeId', '==', empId)
      .where('salaryStructureId', '==', payrun.salaryStructureId)
      .where('status', '==', 'Active')
      .limit(1)
      .get();

    if (contractSnap.empty) {
      throw createError(
        `Computation failed: No active contract found for employee "${empId}" with structure "${payrun.salaryStructureId}".`,
        400
      );
    }
    const contract = serializeTimestamps({
      id: contractSnap.docs[0].id,
      ...contractSnap.docs[0].data(),
    });

    // 3. Fetch Attendance records within period
    const attendanceSnap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('employeeId', '==', empId)
      .get();

    const attendanceRecords = attendanceSnap.docs
      .map((d) => serializeTimestamps({ id: d.id, ...d.data() }))
      .filter((r) => {
        if (!r.date) return true;
        const d = new Date(r.date);
        return d >= new Date(payrun.period.startDate) && d <= new Date(payrun.period.endDate);
      });

    // 4. Execute Phase 2 computation engine
    const payslipOutput = await computePayslip({
      employee,
      contract,
      salaryStructure,
      salaryRules,
      attendanceRecords,
      period: payrun.period,
    });

    // Idempotent payslip document ID: ${payrunId}_${empId}
    const payslipId = `${payrunId}_${empId}`;
    const payslipRef = db.collection(COLLECTIONS.PAYSLIPS).doc(payslipId);

    const now = new Date();
    const payslipDocData = {
      ...payslipOutput,
      payrunId,
      status: PAYRUN_STATUS.COMPUTED,
      createdAt: now,
      updatedAt: now,
    };

    // Idempotent write: set with merge or overwrite
    await payslipRef.set(payslipDocData);

    totalGross += payslipOutput.grossTotal;
    totalNet += payslipOutput.netTotal;
    computedPayslips.push(serializeTimestamps({ id: payslipId, ...payslipDocData }));
  }

  // Update Payrun document
  const now = new Date();
  const updatedPayrunData = {
    status: PAYRUN_STATUS.COMPUTED,
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalEmployees: payrun.employeeIds.length,
    computedAt: now,
    updatedAt: now,
  };

  await payrunRef.update(updatedPayrunData);

  const updatedDoc = await payrunRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * ----------------------------------------------------------------------------
 * VALIDATE PAYRUN (Computed -> Validated)
 * ----------------------------------------------------------------------------
 * Runs pre-finalization checks across all payslips:
 *   - Missing bank details
 *   - Duplicate payslip for employee in other payruns for this period
 *   - Contract status changes
 *   - MissingCheckout attendance days
 *
 * Compiles a payrun-level warning summary without hard-blocking.
 * Transitions status to "Validated".
 *
 * @param {string} payrunId - Payrun ID
 * @returns {Promise<Object>} Updated Payrun doc with warningSummary
 */
async function validatePayrun(payrunId) {
  if (!payrunId || typeof payrunId !== 'string') {
    throw createError('A valid payrunId must be provided', 400);
  }

  const payrunRef = db.collection(COLLECTIONS.PAYRUNS).doc(payrunId);
  const payrunDoc = await payrunRef.get();
  if (!payrunDoc.exists) {
    throw createError(`Payrun "${payrunId}" not found`, 404);
  }

  const payrun = payrunDoc.data();

  // Guard: Must be in "Computed" status
  if (payrun.status !== PAYRUN_STATUS.COMPUTED) {
    throw createError(
      `Cannot validate payrun "${payrunId}": invalid status transition from "${payrun.status}" to "${PAYRUN_STATUS.VALIDATED}". Payrun must be in "Computed" status before validation.`,
      400
    );
  }

  // Fetch all payslips for this payrun
  const payslipsSnap = await db
    .collection(COLLECTIONS.PAYSLIPS)
    .where('payrunId', '==', payrunId)
    .get();

  if (payslipsSnap.empty) {
    throw createError(
      `Cannot validate payrun "${payrunId}": no payslips found. Please compute the payrun first.`,
      400
    );
  }

  const rolledUpWarnings = [];
  let countWithWarnings = 0;

  for (const pDoc of payslipsSnap.docs) {
    const payslip = pDoc.data();
    const currentWarnings = [...(payslip.warnings || [])];

    // Check 1: Duplicate payslip in another payrun for this period
    const duplicateSnap = await db
      .collection(COLLECTIONS.PAYSLIPS)
      .where('employeeId', '==', payslip.employeeId)
      .where('period.startDate', '==', payslip.period.startDate)
      .where('period.endDate', '==', payslip.period.endDate)
      .get();

    const duplicates = duplicateSnap.docs.filter((d) => d.data().payrunId !== payrunId);
    if (duplicates.length > 0) {
      currentWarnings.push(
        `Duplicate payslip detected in external payrun(s) [${duplicates.map((d) => d.data().payrunId).join(', ')}] for period.`
      );
    }

    // Check 2: Contract still active
    if (payslip.contractId) {
      const cDoc = await db.collection(COLLECTIONS.CONTRACTS).doc(payslip.contractId).get();
      if (!cDoc.exists || cDoc.data().status !== 'Active') {
        currentWarnings.push(
          `Contract "${payslip.contractId}" is no longer active (status: ${cDoc.exists ? cDoc.data().status : 'deleted'}).`
        );
      }
    }

    // Update payslip warnings & status to "Validated"
    const uniqueWarnings = [...new Set(currentWarnings)];
    await pDoc.ref.update({
      warnings: uniqueWarnings,
      status: PAYRUN_STATUS.VALIDATED,
      updatedAt: new Date(),
    });

    if (uniqueWarnings.length > 0) {
      countWithWarnings++;
      rolledUpWarnings.push({
        employeeId: payslip.employeeId,
        payslipId: pDoc.id,
        warnings: uniqueWarnings,
      });
    }
  }

  const warningSummary = {
    totalWarnings: rolledUpWarnings.reduce((acc, item) => acc + item.warnings.length, 0),
    countWithWarnings,
    warnings: rolledUpWarnings,
  };

  const now = new Date();
  await payrunRef.update({
    status: PAYRUN_STATUS.VALIDATED,
    warningSummary,
    validatedAt: now,
    updatedAt: now,
  });

  const updatedDoc = await payrunRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * ----------------------------------------------------------------------------
 * MARK PAID (Validated -> Paid)
 * ----------------------------------------------------------------------------
 * Finalizes the payrun and all associated payslips.
 * RBAC Guard: Restricted strictly to "Admin" or "HRPayrollManager".
 *
 * @param {string} payrunId - Payrun ID
 * @param {Object} authUser - { userRole: 'Admin' | 'HRPayrollManager', userId: string }
 * @returns {Promise<Object>} Updated Payrun doc in "Paid" status
 */
async function markPayrunPaid(payrunId, authUser = {}) {
  if (!payrunId || typeof payrunId !== 'string') {
    throw createError('A valid payrunId must be provided', 400);
  }

  // RBAC Check
  const role = (authUser.userRole || authUser.role || '').toLowerCase();
  const allowedRoles = ['admin', 'hrpayrollmanager'];
  if (!allowedRoles.includes(role)) {
    throw createError(
      'Unauthorized: Only HRPayrollManager or Admin can mark a payrun as Paid.',
      403
    );
  }

  const payrunRef = db.collection(COLLECTIONS.PAYRUNS).doc(payrunId);
  const payrunDoc = await payrunRef.get();
  if (!payrunDoc.exists) {
    throw createError(`Payrun "${payrunId}" not found`, 404);
  }

  const payrun = payrunDoc.data();

  // Guard: State transition check (strictly from "Validated")
  if (payrun.status !== PAYRUN_STATUS.VALIDATED) {
    throw createError(
      `Cannot mark payrun "${payrunId}" as Paid: invalid status transition from "${payrun.status}" to "${PAYRUN_STATUS.PAID}". Payrun must be "Validated" first.`,
      400
    );
  }

  const now = new Date();

  // Batch update all payslips for this payrun to "Paid"
  const payslipsSnap = await db
    .collection(COLLECTIONS.PAYSLIPS)
    .where('payrunId', '==', payrunId)
    .get();

  const batch = db.batch();
  for (const pDoc of payslipsSnap.docs) {
    batch.update(pDoc.ref, {
      status: PAYRUN_STATUS.PAID,
      paidAt: now,
      updatedAt: now,
    });
  }

  batch.update(payrunRef, {
    status: PAYRUN_STATUS.PAID,
    paidAt: now,
    paidBy: authUser.userId || authUser.uid || 'system',
    updatedAt: now,
  });

  await batch.commit();

  const updatedDoc = await payrunRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * ----------------------------------------------------------------------------
 * REOPEN PAYRUN (Validated / Computed -> Draft)
 * ----------------------------------------------------------------------------
 * Explicit backward transition for corrections prior to payment.
 *
 * @param {string} payrunId - Payrun ID
 * @returns {Promise<Object>} Updated Payrun doc in "Draft" status
 */
async function reopenPayrun(payrunId) {
  if (!payrunId || typeof payrunId !== 'string') {
    throw createError('A valid payrunId must be provided', 400);
  }

  const payrunRef = db.collection(COLLECTIONS.PAYRUNS).doc(payrunId);
  const payrunDoc = await payrunRef.get();
  if (!payrunDoc.exists) {
    throw createError(`Payrun "${payrunId}" not found`, 404);
  }

  const payrun = payrunDoc.data();

  if (payrun.status === PAYRUN_STATUS.PAID) {
    throw createError('Cannot reopen a payrun that has already been Paid.', 400);
  }

  const now = new Date();
  await payrunRef.update({
    status: PAYRUN_STATUS.DRAFT,
    updatedAt: now,
  });

  const updatedDoc = await payrunRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * ----------------------------------------------------------------------------
 * QUERY HELPERS
 * ----------------------------------------------------------------------------
 */

async function getPayruns(filters = {}) {
  let query = db.collection(COLLECTIONS.PAYRUNS);

  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters.salaryStructureId) {
    query = query.where('salaryStructureId', '==', filters.salaryStructureId);
  }

  const snapshot = await query.get();
  const payruns = snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  payruns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return payruns;
}

async function getPayrunById(id) {
  if (!id || typeof id !== 'string') return null;

  const doc = await db.collection(COLLECTIONS.PAYRUNS).doc(id).get();
  if (!doc.exists) return null;

  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

async function getPayslipsByPayrunId(payrunId) {
  if (!payrunId || typeof payrunId !== 'string') return [];

  const snapshot = await db
    .collection(COLLECTIONS.PAYSLIPS)
    .where('payrunId', '==', payrunId)
    .get();

  return snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );
}

async function deletePayrun(id) {
  if (!id || typeof id !== 'string') return false;

  const docRef = db.collection(COLLECTIONS.PAYRUNS).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return false;

  if (existing.data().status === PAYRUN_STATUS.PAID) {
    throw createError('Cannot delete a payrun that has already been Paid.', 400);
  }

  // Delete all associated payslips
  const payslipsSnap = await db
    .collection(COLLECTIONS.PAYSLIPS)
    .where('payrunId', '==', id)
    .get();

  const batch = db.batch();
  for (const doc of payslipsSnap.docs) {
    batch.delete(doc.ref);
  }
  batch.delete(docRef);
  await batch.commit();

  return true;
}

module.exports = {
  PAYRUN_STATUS,
  getEligibleEmployeesForPayrun,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  reopenPayrun,
  getPayruns,
  getPayrunById,
  getPayslipsByPayrunId,
  deletePayrun,
};
