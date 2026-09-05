const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * ============================================================================
 * PAYSLIP COMPUTATION ENGINE (Phase 2 - Core Deliverable)
 * ============================================================================
 *
 * RULE PRECEDENCE & ORDERING STRATEGY:
 * ----------------------------------------------------------------------------
 * 1. AUTHORITATIVE EXECUTION ORDER:
 *    When evaluating salary rules, each rule's `sequence` field (ascending integer)
 *    is PRIMARY and AUTHORITATIVE. Rules are executed in order of sequence so that
 *    dependencies (e.g. Basic pay) are computed before dependent rules (e.g. HRA,
 *    Gross, PF, Net).
 * 2. MEMBERSHIP & TIE-BREAKER:
 *    `salaryStructure.ruleIds` defines rule membership. If two rules share the exact
 *    same `sequence`, their index order within `ruleIds` serves as the deterministic
 *    tie-breaker.
 * 3. RUNNING COMPUTED VALUES:
 *    A running dictionary `computedValues` keyed by uppercase rule code (e.g. BASIC,
 *    HRA, GROSS) accumulates evaluated amounts. Subsequent rules reference this map.
 * ============================================================================
 */

/**
 * Custom Error Class for computation and validation issues.
 */
class ComputationError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message);
    this.name = 'ComputationError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * ----------------------------------------------------------------------------
 * SAFE FORMULA EXPRESSION EVALUATOR (Zero eval, secure tokenized AST parser)
 * ----------------------------------------------------------------------------
 * Supports:
 *   - Identifiers: rule codes (BASIC, HRA, GROSS, etc.) from computedValues
 *   - Numbers: float or integer (1000, 0.4, 12.5)
 *   - Arithmetic operators: +, -, *, /, %
 *   - Unary operators: +, -
 *   - Parentheses: ( ... )
 *   - Helper functions: min(a, b), max(a, b), round(a)
 */

function tokenize(expression) {
  const tokens = [];
  let i = 0;
  const str = expression.trim();

  while (i < str.length) {
    const char = str[i];

    // Whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (integers or decimals)
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(str[i + 1]))) {
      let numStr = '';
      while (i < str.length && (/[0-9]/.test(str[i]) || str[i] === '.')) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Identifiers (Variable rule codes or built-in functions)
    if (/[a-zA-Z_]/.test(char)) {
      let idStr = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        idStr += str[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr });
      continue;
    }

    // Single-character operators and punctuation
    if ('+-*/%(),'.includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    throw new ComputationError(
      `Unexpected character in formula: "${char}" at position ${i} in "${expression}"`,
      400
    );
  }

  tokens.push({ type: 'EOF' });
  return tokens;
}

class ExpressionParser {
  constructor(tokens, context = {}, ruleCode = '') {
    this.tokens = tokens;
    this.context = context; // computedValues map
    this.ruleCode = ruleCode;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos] || { type: 'EOF' };
  }

  consume(expectedValue) {
    const token = this.peek();
    if (expectedValue && token.value !== expectedValue) {
      throw new ComputationError(
        `Formula syntax error in rule "${this.ruleCode}": expected "${expectedValue}", got "${token.value}"`,
        400
      );
    }
    this.pos++;
    return token;
  }

  parse() {
    const result = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new ComputationError(
        `Formula syntax error in rule "${this.ruleCode}": unexpected token "${this.peek().value}" at end of expression`,
        400
      );
    }
    return result;
  }

  // Expression -> Term (('+' | '-') Term)*
  parseExpression() {
    let left = this.parseTerm();

    while (this.peek().type === 'OPERATOR' && ['+', '-'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseTerm();
      if (op === '+') left += right;
      else if (op === '-') left -= right;
    }

    return left;
  }

  // Term -> Factor (('*' | '/' | '%') Factor)*
  parseTerm() {
    let left = this.parseFactor();

    while (this.peek().type === 'OPERATOR' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseFactor();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) {
          throw new ComputationError(
            `Division by zero encountered in formula for rule "${this.ruleCode}"`,
            400
          );
        }
        left /= right;
      } else if (op === '%') {
        left %= right;
      }
    }

    return left;
  }

  // Factor -> ('+' | '-') Factor | Primary
  parseFactor() {
    const token = this.peek();
    if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
      this.consume();
      const factor = this.parseFactor();
      return token.value === '-' ? -factor : factor;
    }
    return this.parsePrimary();
  }

  // Primary -> NUMBER | IDENTIFIER ('(' args ')')? | '(' Expression ')'
  parsePrimary() {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token.type === 'OPERATOR' && token.value === '(') {
      this.consume('(');
      const val = this.parseExpression();
      this.consume(')');
      return val;
    }

    if (token.type === 'IDENTIFIER') {
      this.consume();
      const id = token.value;

      // Function call
      if (this.peek().type === 'OPERATOR' && this.peek().value === '(') {
        this.consume('(');
        const args = [];
        if (this.peek().type !== 'OPERATOR' || this.peek().value !== ')') {
          args.push(this.parseExpression());
          while (this.peek().type === 'OPERATOR' && this.peek().value === ',') {
            this.consume(',');
            args.push(this.parseExpression());
          }
        }
        this.consume(')');

        const fnName = id.toLowerCase();
        if (fnName === 'min') return Math.min(...args);
        if (fnName === 'max') return Math.max(...args);
        if (fnName === 'round') return Math.round(args[0] ?? 0);

        throw new ComputationError(
          `Unknown function "${id}()" in formula for rule "${this.ruleCode}"`,
          400
        );
      }

      // Variable lookup from computedValues (fail loudly if undefined)
      const normalizedKey = id.toUpperCase();
      if (!(normalizedKey in this.context)) {
        throw new ComputationError(
          `Computation failed in rule "${this.ruleCode}": Variable "${id}" is undefined or has not been computed yet.`,
          400,
          { ruleCode: this.ruleCode, referencedCode: id }
        );
      }

      const val = this.context[normalizedKey];
      if (typeof val !== 'number' || isNaN(val)) {
        throw new ComputationError(
          `Variable "${id}" evaluated to invalid numeric value (${val}) in rule "${this.ruleCode}"`,
          400
        );
      }
      return val;
    }

    throw new ComputationError(
      `Formula syntax error in rule "${this.ruleCode}": unexpected token "${token.value}"`,
      400
    );
  }
}

/**
 * Safely evaluates a formula expression string against running computedValues.
 *
 * @param {string} formula - e.g. "BASIC + HRA * 0.5"
 * @param {Object} computedValues - Running map of already-computed rule codes
 * @param {string} ruleCode - Current rule code for error tracing
 * @returns {number} Evaluated result
 */
function evaluateFormula(formula, computedValues = {}, ruleCode = '') {
  if (!formula || typeof formula !== 'string' || !formula.trim()) {
    throw new ComputationError(`Empty formula expression in rule "${ruleCode}"`, 400);
  }
  const tokens = tokenize(formula);
  const parser = new ExpressionParser(tokens, computedValues, ruleCode);
  const result = parser.parse();

  if (typeof result !== 'number' || isNaN(result)) {
    throw new ComputationError(
      `Formula for rule "${ruleCode}" evaluated to non-numeric result: ${result}`,
      400
    );
  }
  return result;
}

/**
 * ----------------------------------------------------------------------------
 * DRY VALIDATE STRUCTURE (Save-time circular & forward reference validation)
 * ----------------------------------------------------------------------------
 * Evaluates an ordered list of Salary Rules for dependency correctness:
 * - Ensures rules only reference rule codes that have ALREADY executed prior.
 * - Detects forward references (e.g. sequence 10 referencing sequence 20).
 * - Detects non-existent references.
 *
 * @param {Array<Object>} rules - List of SalaryRule objects
 * @returns {{ isValid: boolean, errors: Array<string> }}
 */
function dryValidateStructure(rules = []) {
  const errors = [];
  if (!Array.isArray(rules) || rules.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Sort by sequence ascending (authoritative order)
  const sortedRules = [...rules].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const definedCodes = new Set();
  const allCodes = new Map();

  for (const r of sortedRules) {
    if (r.code) {
      allCodes.set(r.code.toUpperCase(), r);
    }
  }

  for (const rule of sortedRules) {
    const code = (rule.code || '').toUpperCase();
    const computeType = rule.computeType;

    // 1. Percentage Dependency Check
    if (computeType === 'Percentage') {
      const targetCode = (rule.percentageOf || rule.baseRuleCode || '').toUpperCase();
      if (!targetCode) {
        errors.push(`Rule "${code}" (sequence ${rule.sequence}) is missing target "percentageOf" rule code.`);
      } else if (!definedCodes.has(targetCode)) {
        if (allCodes.has(targetCode)) {
          const downstream = allCodes.get(targetCode);
          errors.push(
            `Forward reference in rule "${code}" (sequence ${rule.sequence}): references "${targetCode}" (sequence ${downstream.sequence}), which executes AFTER "${code}". Sequence "${targetCode}" before "${code}".`
          );
        } else {
          errors.push(
            `Missing reference in rule "${code}" (sequence ${rule.sequence}): references "${targetCode}", which does not exist in this salary structure.`
          );
        }
      }
    }

    // 2. Formula Dependency Check
    if (computeType === 'Formula' && rule.formula) {
      try {
        const tokens = tokenize(rule.formula);
        const builtInFunctions = ['min', 'max', 'round'];

        for (const token of tokens) {
          if (token.type === 'IDENTIFIER') {
            const refCode = token.value.toUpperCase();
            if (builtInFunctions.includes(token.value.toLowerCase())) continue;

            if (!definedCodes.has(refCode)) {
              if (allCodes.has(refCode)) {
                const downstream = allCodes.get(refCode);
                errors.push(
                  `Forward reference in formula for rule "${code}" (sequence ${rule.sequence}): references "${refCode}" (sequence ${downstream.sequence}), which executes AFTER "${code}". Sequence "${refCode}" before "${code}".`
                );
              } else {
                errors.push(
                  `Missing reference in formula for rule "${code}" (sequence ${rule.sequence}): references "${refCode}", which does not exist in this salary structure.`
                );
              }
            }
          }
        }
      } catch (err) {
        errors.push(`Syntax error in formula for rule "${code}": ${err.message}`);
      }
    }

    if (code) {
      definedCodes.add(code);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * ----------------------------------------------------------------------------
 * CONTRACT VALIDATION
 * ----------------------------------------------------------------------------
 * Validates contract status ("Active") and period coverage.
 */
function validateContract(contract, period, warnings = []) {
  if (!contract) {
    throw new ComputationError('No active contract provided for payslip computation', 400);
  }

  // 1. Status Check (must be "Active")
  const status = (contract.status || '').trim();
  if (status.toLowerCase() !== 'active') {
    throw new ComputationError(
      `Contract "${contract.id || 'N/A'}" is not Active (current status: "${contract.status}"). Payslip computation rejected.`,
      400,
      { contractId: contract.id, status: contract.status }
    );
  }

  // 2. Date Coverage Check
  if (period && period.startDate && period.endDate) {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);

    if (contract.startDate) {
      const contractStart = new Date(contract.startDate);
      if (contractStart > periodEnd) {
        throw new ComputationError(
          `Contract starts after the payrun period (contract start: ${contract.startDate}, period end: ${period.endDate}).`,
          400
        );
      }
      if (contractStart > periodStart) {
        warnings.push(`Contract started mid-period on ${contract.startDate}.`);
      }
    }

    if (contract.endDate) {
      const contractEnd = new Date(contract.endDate);
      if (contractEnd < periodStart) {
        throw new ComputationError(
          `Contract expired before the payrun period (contract end: ${contract.endDate}, period start: ${period.startDate}).`,
          400
        );
      }
      if (contractEnd < periodEnd) {
        warnings.push(`Contract ending mid-period on ${contract.endDate}.`);
      }
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * ATTENDANCE & WORKED DAYS CALCULATION
 * ----------------------------------------------------------------------------
 * Counts days with status "Present", "Late", or "Overtime" as worked (1 day).
 * "Absent" as not worked (0 days).
 * "MissingCheckout" is counted as worked (1 day) BUT triggers an audit warning.
 */
function calculateWorkedDays(attendanceRecords = [], period = {}, warnings = []) {
  let workedDays = 0;
  let missingCheckoutCount = 0;

  const start = period.startDate ? new Date(period.startDate) : null;
  const end = period.endDate ? new Date(period.endDate) : null;

  for (const record of attendanceRecords) {
    // If record has date, filter within period
    if (record.date && (start || end)) {
      const recDate = new Date(record.date);
      if (start && recDate < start) continue;
      if (end && recDate > end) continue;
    }

    const status = (record.status || '').trim();

    if (['Present', 'Late', 'Overtime'].includes(status)) {
      workedDays += 1;
    } else if (status === 'MissingCheckout') {
      workedDays += 1;
      missingCheckoutCount += 1;
    } else if (status === 'HalfDay') {
      workedDays += 0.5;
    }
    // 'Absent' contributes 0
  }

  if (missingCheckoutCount > 0) {
    warnings.push(
      `Attendance audit: ${missingCheckoutCount} day(s) with "MissingCheckout" status recorded during period. Counted as worked day(s).`
    );
  }

  return workedDays;
}

/**
 * ----------------------------------------------------------------------------
 * CORE PAYSLIP COMPUTATION ENGINE
 * ----------------------------------------------------------------------------
 *
 * @param {Object} params
 * @param {string|Object} params.employee - Employee object or employeeId
 * @param {Object} params.contract - Contract object with status, wage, salaryStructureId
 * @param {Object} [params.salaryStructure] - Pre-loaded SalaryStructure doc
 * @param {Array<Object>} [params.salaryRules] - Pre-loaded array of SalaryRule docs
 * @param {Array<Object>} [params.attendanceRecords] - Attendance records within period
 * @param {Object} [params.workingSchedule] - Optional working schedule (scheduledDays)
 * @param {Object} params.period - Payrun period: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @returns {Promise<Object>} Formatted payslip matching schema
 */
async function computePayslip(params = {}) {
  const {
    employee,
    contract,
    salaryStructure: directStructure,
    salaryRules: directRules,
    attendanceRecords = [],
    workingSchedule = {},
    period = {},
  } = params;

  const warnings = [];

  // 1. Employee Validation
  const employeeObj = typeof employee === 'object' && employee !== null ? employee : { id: employee };
  const employeeId = employeeObj.id || employeeObj.uid || String(employee || '');

  if (!employeeId) {
    throw new ComputationError('Field "employeeId" is required for payslip computation', 400);
  }

  // Audit warning: missing bank details
  const hasBankDetails = Boolean(
    employeeObj.bankAccount ||
    employeeObj.bankAccountNumber ||
    employeeObj.bankDetails ||
    employeeObj.accountNumber
  );
  if (!hasBankDetails) {
    warnings.push('Employee has missing bank details. Payment disbursement may require attention.');
  }

  // 2. Contract Validation
  validateContract(contract, period, warnings);
  const contractId = contract.id || 'N/A';

  // 3. Resolve Salary Structure
  let structure = directStructure;
  const structureId = structure?.id || contract.salaryStructureId;

  if (!structure && structureId) {
    const structDoc = await db.collection('salary_structures').doc(structureId).get();
    if (structDoc.exists) {
      structure = serializeTimestamps({ id: structDoc.id, ...structDoc.data() });
    }
  }

  if (!structure) {
    throw new ComputationError(
      `Salary Structure "${structureId}" not found for contract "${contractId}"`,
      404
    );
  }

  // 4. Resolve and Order Salary Rules
  // DECISION: ruleIds provides membership; sequence provides execution order;
  // ruleIds index provides deterministic tie-breaker.
  let rules = directRules;
  if (!rules || rules.length === 0) {
    const ruleIds = structure.ruleIds || [];
    if (ruleIds.length === 0) {
      throw new ComputationError(
        `Salary Structure "${structure.name || structureId}" contains no salary rules`,
        400
      );
    }

    const fetchedRuleDocs = await Promise.all(
      ruleIds.map((rId) => db.collection('salary_rules').doc(rId).get())
    );

    rules = fetchedRuleDocs
      .filter((doc) => doc.exists)
      .map((doc) => serializeTimestamps({ id: doc.id, ...doc.data() }));
  }

  // Build membership index map for tie-breaking
  const ruleIdIndexMap = new Map();
  (structure.ruleIds || []).forEach((rId, idx) => ruleIdIndexMap.set(rId, idx));

  // Sort rules strictly by sequence ascending, then by ruleIds order
  const sortedRules = [...rules].sort((a, b) => {
    const seqA = a.sequence ?? 0;
    const seqB = b.sequence ?? 0;
    if (seqA !== seqB) return seqA - seqB;
    const idxA = ruleIdIndexMap.get(a.id) ?? 0;
    const idxB = ruleIdIndexMap.get(b.id) ?? 0;
    return idxA - idxB;
  });

  // 5. Pre-execution dry-run dependency validation
  const structureValidation = dryValidateStructure(sortedRules);
  if (!structureValidation.isValid) {
    throw new ComputationError(
      `Salary structure contains sequencing / reference errors:\n- ${structureValidation.errors.join('\n- ')}`,
      400,
      { errors: structureValidation.errors }
    );
  }

  // 6. Compute workedDays and Scheduled Days
  const scheduledDays =
    workingSchedule.scheduledDays ||
    workingSchedule.workingDaysCount ||
    22; // Sensible default for a standard working month

  let workedDays = 0;
  if (attendanceRecords && attendanceRecords.length > 0) {
    workedDays = calculateWorkedDays(attendanceRecords, period, warnings);
  } else {
    // If no attendance records provided, default workedDays to scheduledDays
    workedDays = scheduledDays;
    warnings.push(
      `No attendance records found for period; defaulted workedDays to ${scheduledDays} scheduled days.`
    );
  }

  // 7. Execute Rules in Strict Sequence
  const computedValues = {};
  const ruleBreakdown = [];
  let computedGross = 0;
  let computedDeductions = 0;

  for (const rule of sortedRules) {
    const code = (rule.code || '').toUpperCase();
    const computeType = rule.computeType;
    let amount = 0;

    switch (computeType) {
      case 'Fixed': {
        // Amount from rule or fallback to contract wage if Basic
        const baseAmount = Number(rule.amount ?? rule.value ?? 0);

        // Proration support:
        // If rule.isProratable is true, prorate by workedDays / scheduledDays
        if (rule.isProratable && scheduledDays > 0) {
          const prorationRatio = Math.min(1, workedDays / scheduledDays);
          amount = Math.round(baseAmount * prorationRatio * 100) / 100;
        } else {
          amount = Math.round(baseAmount * 100) / 100;
        }
        break;
      }

      case 'Percentage': {
        const targetCode = (rule.percentageOf || rule.baseRuleCode || '').toUpperCase();
        if (!(targetCode in computedValues)) {
          throw new ComputationError(
            `Rule "${code}" (${rule.name}) references base rule "${targetCode}", but "${targetCode}" has not executed yet or is undefined.`,
            400,
            { ruleCode: code, missingBaseCode: targetCode }
          );
        }

        const baseVal = computedValues[targetCode];
        const pct = Number(rule.percentage || 0);
        amount = Math.round(((pct / 100) * baseVal) * 100) / 100;
        break;
      }

      case 'Formula': {
        const rawResult = evaluateFormula(rule.formula, computedValues, code);
        amount = Math.round(rawResult * 100) / 100;
        break;
      }

      default:
        throw new ComputationError(
          `Unknown computeType "${computeType}" in rule "${code}"`,
          400
        );
    }

    // Store in running computedValues dictionary
    computedValues[code] = amount;

    // Track category contributions
    if (rule.category === 'Basic' || rule.category === 'Allowance') {
      computedGross += amount;
    } else if (rule.category === 'Deduction') {
      computedDeductions += amount;
    }

    ruleBreakdown.push({
      ruleId: rule.id || code,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      amount,
    });
  }

  // 8. Compute Top-Level Totals
  // If an explicit rule for GROSS or NET was evaluated, prefer it; otherwise use category sums
  const grossTotal =
    'GROSS' in computedValues
      ? computedValues['GROSS']
      : Math.round(computedGross * 100) / 100;

  const netTotal =
    'NET' in computedValues
      ? computedValues['NET']
      : Math.round((grossTotal - computedDeductions) * 100) / 100;

  // 9. Return Schema-Compliant Payslip Payload
  return {
    employeeId,
    contractId,
    salaryStructureId: structure.id || structureId,
    period: {
      startDate: period.startDate || null,
      endDate: period.endDate || null,
    },
    workedDays,
    scheduledDays,
    grossTotal,
    netTotal,
    ruleBreakdown,
    warnings,
  };
}

module.exports = {
  computePayslip,
  dryValidateStructure,
  evaluateFormula,
  calculateWorkedDays,
  validateContract,
  ComputationError,
};
