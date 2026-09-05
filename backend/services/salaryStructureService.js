const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Collection name in Firestore for Salary Structures
 */
const COLLECTION = 'salary_structures';
const RULES_COLLECTION = 'salary_rules';

/**
 * SALARY COMPUTATION PRECEDENCE & ORDERING STRATEGY:
 * --------------------------------------------------
 * In salary calculation, both the SalaryRule's `sequence` field and the SalaryStructure's
 * `ruleIds` array express ordering. The system defines the following authoritative hierarchy:
 *
 * 1. AUTHORITATIVE EXECUTION ORDER:
 *    The `sequence` field (integer >= 0) on each SalaryRule is the PRIMARY and AUTHORITATIVE
 *    determinant of computation order in the salary engine. Rules are computed in ascending
 *    order of `sequence` (e.g. sequence 1: BASIC -> sequence 2: HRA -> sequence 10: GROSS ->
 *    sequence 20: DEDUCTIONS -> sequence 30: NET). This ensures that upstream dependency
 *    values are computed before downstream formulas evaluate them.
 *
 * 2. TIE-BREAKER & DISPLAY PRECEDENCE:
 *    The ordered `ruleIds` array in SalaryStructure preserves its exact input order and serves two roles:
 *    a) Deterministic Tie-Breaker: When two rules share the exact same `sequence` number,
 *       their relative index in `ruleIds` is used as the tie-breaker to determine calculation order.
 *    b) Presentation / Payslip Order: The exact index order of `ruleIds` defines the presentation
 *       and display order for payslips, itemized compensation breakdowns, and UI tables.
 */

/**
 * Helper to construct operational errors with HTTP status codes.
 */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Verifies that all referenced rule IDs exist in the salary_rules collection,
 * and performs save-time dry-validation for forward or circular dependencies.
 *
 * @param {Array<string>} ruleIds - Array of rule document IDs
 * @throws {Error} 400 error if any rule ID is not found or has sequencing errors
 */
async function verifyRuleIdsExist(ruleIds) {
  if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
    return;
  }

  const missingIds = [];
  const fetchedRules = [];

  // Use Promise.all to check all rule IDs concurrently
  await Promise.all(
    ruleIds.map(async (ruleId) => {
      if (typeof ruleId !== 'string' || !ruleId.trim()) {
        missingIds.push(String(ruleId));
        return;
      }
      const doc = await db.collection(RULES_COLLECTION).doc(ruleId.trim()).get();
      if (!doc.exists) {
        missingIds.push(ruleId);
      } else {
        fetchedRules.push({ id: doc.id, ...doc.data() });
      }
    })
  );

  if (missingIds.length > 0) {
    throw createError(
      `Cannot save Salary Structure: Referenced salary rule ID(s) do not exist: ${missingIds.join(', ')}`,
      400
    );
  }

  // Perform save-time dry validation against forward or circular references
  const { dryValidateStructure } = require('./payslipComputationEngine');
  const validation = dryValidateStructure(fetchedRules);
  if (!validation.isValid) {
    throw createError(
      `Cannot save Salary Structure due to sequencing/reference errors:\n- ${validation.errors.join('\n- ')}`,
      400
    );
  }
}

/**
 * Validates Salary Structure input data.
 *
 * @param {Object} data - Input payload
 * @param {boolean} isUpdate - True if validating an update payload
 * @returns {Object} Validated fields
 */
function validateStructureData(data = {}, isUpdate = false) {
  const result = {};

  // 1. Name validation
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw createError('Field "name" must be a non-empty string', 400);
    }
    result.name = data.name.trim();
  } else if (!isUpdate) {
    throw createError('Field "name" is required', 400);
  }

  // 2. Description validation (optional)
  if (data.description !== undefined) {
    result.description = typeof data.description === 'string' ? data.description.trim() : '';
  } else if (!isUpdate) {
    result.description = '';
  }

  // 3. ruleIds validation (must be array, preserving order)
  if (data.ruleIds !== undefined) {
    if (!Array.isArray(data.ruleIds)) {
      throw createError('Field "ruleIds" must be an array of Salary Rule IDs', 400);
    }
    for (let i = 0; i < data.ruleIds.length; i++) {
      const id = data.ruleIds[i];
      if (typeof id !== 'string' || !id.trim()) {
        throw createError(`Rule ID at index ${i} must be a non-empty string`, 400);
      }
    }
    // Preserve input ordering exactly as provided
    result.ruleIds = data.ruleIds.map((id) => id.trim());
  } else if (!isUpdate) {
    result.ruleIds = [];
  }

  // 4. isActive flag
  if (data.isActive !== undefined) {
    result.isActive = Boolean(data.isActive);
  } else if (!isUpdate) {
    result.isActive = true;
  }

  return result;
}

/**
 * Create a new Salary Structure.
 *
 * @param {Object} data - Structure attributes
 * @returns {Promise<Object>} Serialized created structure
 */
async function createSalaryStructure(data = {}) {
  const payload = validateStructureData(data, false);

  // Validate that all referenced rules exist in the database
  if (payload.ruleIds && payload.ruleIds.length > 0) {
    await verifyRuleIdsExist(payload.ruleIds);
  }

  const now = new Date();
  const docData = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTION).add(docData);
  return serializeTimestamps({ id: docRef.id, ...docData });
}

/**
 * Retrieve all Salary Structures.
 *
 * @param {Object} [filters={}] - Optional filters (isActive)
 * @returns {Promise<Array<Object>>} List of serialized Salary Structures
 */
async function getSalaryStructures(filters = {}) {
  let query = db.collection(COLLECTION);

  if (typeof filters.isActive === 'boolean') {
    query = query.where('isActive', '==', filters.isActive);
  }

  const snapshot = await query.get();
  const structures = snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  // Sort by createdAt descending
  structures.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return structures;
}

/**
 * Retrieve a single Salary Structure by ID.
 * Optionally populates full SalaryRule objects preserving the exact order of `ruleIds`.
 *
 * @param {string} id - Salary Structure ID
 * @param {Object} [options={}] - Options, e.g. { populateRules: true }
 * @returns {Promise<Object|null>} Serialized structure or null if not found
 */
async function getSalaryStructureById(id, options = {}) {
  if (!id || typeof id !== 'string') return null;

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const structure = serializeTimestamps({ id: doc.id, ...doc.data() });

  if (options.populateRules && Array.isArray(structure.ruleIds) && structure.ruleIds.length > 0) {
    // Fetch rules and maintain the exact order from ruleIds
    const ruleDocs = await Promise.all(
      structure.ruleIds.map((ruleId) => db.collection(RULES_COLLECTION).doc(ruleId).get())
    );

    structure.rules = ruleDocs
      .filter((rDoc) => rDoc.exists)
      .map((rDoc) => serializeTimestamps({ id: rDoc.id, ...rDoc.data() }));
  }

  return structure;
}

/**
 * Update an existing Salary Structure.
 *
 * @param {string} id - Salary Structure ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated serialized Salary Structure
 */
async function updateSalaryStructure(id, updates = {}) {
  if (!id || typeof id !== 'string') {
    throw createError('A valid structure ID must be provided for update', 400);
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) {
    throw createError(`Salary structure with ID "${id}" not found`, 404);
  }

  const validatedPayload = validateStructureData(updates, true);

  // If ruleIds are updated, verify all referenced rules exist
  if (validatedPayload.ruleIds && validatedPayload.ruleIds.length > 0) {
    await verifyRuleIdsExist(validatedPayload.ruleIds);
  }

  validatedPayload.updatedAt = new Date();

  await docRef.update(validatedPayload);

  const updatedDoc = await docRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * Delete a Salary Structure by ID.
 *
 * @param {string} id - Salary Structure ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteSalaryStructure(id) {
  if (!id || typeof id !== 'string') return false;

  const docRef = db.collection(COLLECTION).doc(id);
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) return false;

  await docRef.delete();
  return true;
}

module.exports = {
  createSalaryStructure,
  getSalaryStructures,
  getSalaryStructureById,
  updateSalaryStructure,
  deleteSalaryStructure,
  verifyRuleIdsExist,
  validateStructureData,
};
