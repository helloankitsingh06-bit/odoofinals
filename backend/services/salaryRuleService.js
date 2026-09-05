const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Collection name in Firestore for Salary Rules
 */
const COLLECTION = 'salary_rules';

/**
 * Permitted categories and compute types
 */
const ALLOWED_CATEGORIES = ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net'];
const ALLOWED_COMPUTE_TYPES = ['Fixed', 'Percentage', 'Formula'];

/**
 * Helper to construct operational errors with HTTP status codes.
 */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Validates and normalizes Salary Rule inputs.
 *
 * @param {Object} data - Input payload
 * @param {boolean} isUpdate - Whether this is an update validation (fields may be optional)
 * @returns {Object} Cleaned and validated payload
 */
function validateSalaryRuleData(data = {}, isUpdate = false) {
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

  // 2. Code validation (uppercase alphanumeric + underscore)
  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || !data.code.trim()) {
      throw createError('Field "code" must be a non-empty string', 400);
    }
    const normalizedCode = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(normalizedCode)) {
      throw createError(
        'Field "code" may only contain alphanumeric characters and underscores (e.g. BASIC, HRA, PF)',
        400
      );
    }
    result.code = normalizedCode;
  } else if (!isUpdate) {
    throw createError('Field "code" is required', 400);
  }

  // 3. Category validation
  if (data.category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(data.category)) {
      throw createError(
        `Field "category" must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        400
      );
    }
    result.category = data.category;
  } else if (!isUpdate) {
    throw createError(
      `Field "category" is required (${ALLOWED_CATEGORIES.join(', ')})`,
      400
    );
  }

  // 4. Sequence validation (must be integer >= 0)
  if (data.sequence !== undefined) {
    const seq = Number(data.sequence);
    if (!Number.isInteger(seq)) {
      throw createError('Field "sequence" must be an integer', 400);
    }
    if (seq < 0) {
      throw createError('Field "sequence" cannot be negative', 400);
    }
    result.sequence = seq;
  } else if (!isUpdate) {
    throw createError('Field "sequence" is required and must be a non-negative integer', 400);
  }

  // 5. ComputeType & associated value fields validation
  if (data.computeType !== undefined) {
    if (!ALLOWED_COMPUTE_TYPES.includes(data.computeType)) {
      throw createError(
        `Field "computeType" must be one of: ${ALLOWED_COMPUTE_TYPES.join(', ')}`,
        400
      );
    }
    result.computeType = data.computeType;
  } else if (!isUpdate) {
    throw createError(
      `Field "computeType" is required (${ALLOWED_COMPUTE_TYPES.join(', ')})`,
      400
    );
  }

  // Validate dependent value fields based on computeType
  const activeComputeType = result.computeType || data.computeType;

  if (activeComputeType === 'Fixed') {
    if (data.amount !== undefined) {
      const amount = Number(data.amount);
      if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        throw createError('For "Fixed" computeType, "amount" must be a non-negative number', 400);
      }
      result.amount = amount;
    } else if (!isUpdate) {
      throw createError('For "Fixed" computeType, "amount" is required', 400);
    }
    result.percentage = null;
    result.percentageOf = null;
    result.formula = null;
  } else if (activeComputeType === 'Percentage') {
    if (data.percentage !== undefined) {
      const pct = Number(data.percentage);
      if (typeof pct !== 'number' || isNaN(pct) || pct < 0) {
        throw createError('For "Percentage" computeType, "percentage" must be a non-negative number', 400);
      }
      result.percentage = pct;
    } else if (!isUpdate) {
      throw createError('For "Percentage" computeType, "percentage" is required', 400);
    }

    const percentageOf = data.percentageOf || data.baseRuleCode;
    if (percentageOf !== undefined) {
      if (typeof percentageOf !== 'string' || !percentageOf.trim()) {
        throw createError('For "Percentage" computeType, "percentageOf" (target rule code) must be a non-empty string', 400);
      }
      result.percentageOf = percentageOf.trim().toUpperCase();
    } else if (!isUpdate) {
      throw createError('For "Percentage" computeType, "percentageOf" (target rule code) is required', 400);
    }
    result.amount = null;
    result.formula = null;
  } else if (activeComputeType === 'Formula') {
    if (data.formula !== undefined) {
      if (typeof data.formula !== 'string' || !data.formula.trim()) {
        throw createError('For "Formula" computeType, "formula" must be a non-empty string', 400);
      }
      result.formula = data.formula.trim();
    } else if (!isUpdate) {
      throw createError('For "Formula" computeType, "formula" is required', 400);
    }
    result.amount = null;
    result.percentage = null;
    result.percentageOf = null;
  }

  // 6. Optional metadata fields
  if (data.description !== undefined) {
    result.description = typeof data.description === 'string' ? data.description.trim() : '';
  } else if (!isUpdate) {
    result.description = '';
  }

  if (data.isActive !== undefined) {
    result.isActive = Boolean(data.isActive);
  } else if (!isUpdate) {
    result.isActive = true;
  }

  return result;
}

/**
 * Checks if a rule code already exists in the database.
 *
 * @param {string} code - Uppercase rule code
 * @param {string} [excludeId] - Optional document ID to ignore (for updates)
 * @returns {Promise<boolean>} True if code is already taken
 */
async function isRuleCodeTaken(code, excludeId = null) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('code', '==', code)
    .get();

  if (snapshot.empty) return false;
  if (!excludeId) return true;

  return snapshot.docs.some((doc) => doc.id !== excludeId);
}

/**
 * Create a new Salary Rule.
 *
 * @param {Object} data - Rule attributes
 * @returns {Promise<Object>} Created Salary Rule with generated ID
 */
async function createSalaryRule(data = {}) {
  const payload = validateSalaryRuleData(data, false);

  // Enforce unique code constraint
  const alreadyExists = await isRuleCodeTaken(payload.code);
  if (alreadyExists) {
    throw createError(`Salary rule with code "${payload.code}" already exists`, 409);
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
 * Retrieve all Salary Rules.
 * Rules are sorted primarily by sequence ascending.
 *
 * @param {Object} [filters={}] - Optional filters (category, isActive)
 * @returns {Promise<Array<Object>>} List of serialized Salary Rules
 */
async function getSalaryRules(filters = {}) {
  let query = db.collection(COLLECTION);

  if (filters.category) {
    query = query.where('category', '==', filters.category);
  }
  if (typeof filters.isActive === 'boolean') {
    query = query.where('isActive', '==', filters.isActive);
  }

  const snapshot = await query.get();
  const rules = snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  // In-memory sort by sequence ascending
  rules.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  return rules;
}

/**
 * Retrieve a single Salary Rule by its Firestore document ID.
 *
 * @param {string} id - Salary Rule ID
 * @returns {Promise<Object|null>} Serialized Salary Rule or null if not found
 */
async function getSalaryRuleById(id) {
  if (!id || typeof id !== 'string') return null;

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Retrieve a single Salary Rule by its unique rule code.
 *
 * @param {string} code - Rule code (e.g. "BASIC", "HRA")
 * @returns {Promise<Object|null>} Serialized Salary Rule or null if not found
 */
async function getSalaryRuleByCode(code) {
  if (!code || typeof code !== 'string') return null;

  const normalizedCode = code.trim().toUpperCase();
  const snapshot = await db
    .collection(COLLECTION)
    .where('code', '==', normalizedCode)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Update an existing Salary Rule.
 *
 * @param {string} id - Salary Rule ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated Salary Rule
 */
async function updateSalaryRule(id, updates = {}) {
  if (!id || typeof id !== 'string') {
    throw createError('A valid rule ID must be provided for update', 400);
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) {
    throw createError(`Salary rule with ID "${id}" not found`, 404);
  }

  const existingData = existingDoc.data();
  const mergedData = { ...existingData, ...updates };
  const validatedPayload = validateSalaryRuleData(mergedData, true);

  // If code is being updated, verify uniqueness against other documents
  if (validatedPayload.code && validatedPayload.code !== existingData.code) {
    const codeTaken = await isRuleCodeTaken(validatedPayload.code, id);
    if (codeTaken) {
      throw createError(`Salary rule with code "${validatedPayload.code}" already exists`, 409);
    }
  }

  validatedPayload.updatedAt = new Date();

  await docRef.update(validatedPayload);

  const updatedDoc = await docRef.get();
  return serializeTimestamps({ id: updatedDoc.id, ...updatedDoc.data() });
}

/**
 * Delete a Salary Rule by ID.
 *
 * @param {string} id - Salary Rule ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteSalaryRule(id) {
  if (!id || typeof id !== 'string') return false;

  const docRef = db.collection(COLLECTION).doc(id);
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) return false;

  await docRef.delete();
  return true;
}

module.exports = {
  createSalaryRule,
  getSalaryRules,
  getSalaryRuleById,
  getSalaryRuleByCode,
  updateSalaryRule,
  deleteSalaryRule,
  validateSalaryRuleData,
  ALLOWED_CATEGORIES,
  ALLOWED_COMPUTE_TYPES,
};
