import { RuleCategory, ComputeType, WarningType } from '../types';

export interface RuleDefinition {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  computeType: string;
  value?: number | null;
  formula?: string | null;
  position?: number;
}

export interface ContractInfo {
  id: string;
  employeeId: string;
  wage: number;
  startDate: Date;
  endDate?: Date | null;
  status: string;
  salaryStructureId: string;
  salaryStructure?: {
    id: string;
    name: string;
    rules: Array<{
      position: number;
      salaryRule: RuleDefinition;
    }>;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkIn: Date;
  checkOut?: Date | null;
  workedHours: number;
  status: string;
}

export interface ComputationInput {
  employee: {
    id: string;
    name: string;
    department: string;
    jobPosition: string;
  };
  contract: ContractInfo;
  periodStart: Date;
  periodEnd: Date;
  attendances?: AttendanceRecord[];
  rules: RuleDefinition[]; // Ordered by position
}

export interface ComputedRuleLine {
  salaryRuleId: string;
  name: string;
  code: string;
  category: string;
  amount: number;
}

export interface ComputationWarning {
  message: string;
  type: WarningType;
}

export interface ComputationResult {
  workedDays: number;
  grossTotal: number;
  netTotal: number;
  ruleLines: ComputedRuleLine[];
  warnings: ComputationWarning[];
  computedValues: Record<string, number>;
}

/**
 * Safe Math Formula Evaluator (No eval, full AST/token parsing)
 */
export class SafeFormulaEvaluator {
  private tokens: string[] = [];
  private pos = 0;

  constructor(private expression: string, private scope: Record<string, number>) {
    this.tokens = this.tokenize(expression);
  }

  public static evaluate(expression: string, scope: Record<string, number>): number {
    const evaluator = new SafeFormulaEvaluator(expression, scope);
    return evaluator.parseExpression();
  }

  private tokenize(expr: string): string[] {
    const regex = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()])/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(expr)) !== null) {
      tokens.push(match[1]);
    }
    return tokens;
  }

  private peek(): string | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private consume(): string {
    return this.tokens[this.pos++];
  }

  public parseExpression(): number {
    let result = this.parseTerm();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.consume();
      const right = this.parseTerm();
      if (op === '+') result += right;
      else if (op === '-') result -= right;
    }
    return result;
  }

  private parseTerm(): number {
    let result = this.parseFactor();
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.consume();
      const right = this.parseFactor();
      if (op === '*') result *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero in formula evaluation');
        result /= right;
      }
    }
    return result;
  }

  private parseFactor(): number {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token === '+') {
      this.consume();
      return this.parseFactor();
    }
    if (token === '-') {
      this.consume();
      return -this.parseFactor();
    }
    if (token === '(') {
      this.consume();
      const result = this.parseExpression();
      if (this.consume() !== ')') throw new Error('Missing closing parenthesis in formula');
      return result;
    }

    this.consume();
    // Check if number
    if (!isNaN(Number(token))) {
      return Number(token);
    }

    // Must be identifier (rule code)
    const upperToken = token.toUpperCase();
    if (upperToken in this.scope) {
      return this.scope[upperToken];
    }

    throw new Error(`Referenced rule variable '${token}' has not been computed yet or does not exist`);
  }
}

/**
 * Dry-run structure validation to prevent forward/circular references
 */
export function validateSalaryStructureRules(rules: RuleDefinition[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const knownCodes = new Set<string>();

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const code = rule.code.toUpperCase();

    if (knownCodes.has(code)) {
      errors.push(`Duplicate rule code '${rule.code}' found in structure`);
    }

    if (rule.computeType === ComputeType.Percentage) {
      // Look for referenced rule in formula or default to BASIC
      const targetCode = (rule.formula?.trim().toUpperCase()) || 'BASIC';
      if (!knownCodes.has(targetCode) && targetCode !== code) {
        errors.push(
          `Rule '${rule.name}' (${rule.code}) depends on '${targetCode}', which appears later or is missing`
        );
      }
    } else if (rule.computeType === ComputeType.Formula) {
      if (!rule.formula) {
        errors.push(`Formula rule '${rule.name}' (${rule.code}) is missing formula expression`);
      } else {
        // Extract all word tokens
        const vars = rule.formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
        for (const v of vars) {
          const varUpper = v.toUpperCase();
          if (!knownCodes.has(varUpper)) {
            errors.push(
              `Formula rule '${rule.name}' (${rule.code}) references '${v}' before it is computed in the sequence`
            );
          }
        }
      }
    }

    knownCodes.add(code);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Core Payroll Computation Function
 */
export function computeEmployeePayslip(input: ComputationInput): ComputationResult {
  const warnings: ComputationWarning[] = [];
  const computedValues: Record<string, number> = {};
  const ruleLines: ComputedRuleLine[] = [];

  const { employee, contract, periodStart, periodEnd, attendances = [], rules } = input;

  // 1. Contract Validations
  if (contract.status !== 'Active') {
    warnings.push({
      message: `Contract ${contract.id} is not Active (Status: ${contract.status})`,
      type: WarningType.Warning
    });
  }

  const pStart = new Date(periodStart).getTime();
  const pEnd = new Date(periodEnd).getTime();
  const cStart = new Date(contract.startDate).getTime();
  const cEnd = contract.endDate ? new Date(contract.endDate).getTime() : Infinity;

  if (cStart > pStart) {
    warnings.push({
      message: `Contract started mid-period on ${new Date(contract.startDate).toISOString().slice(0, 10)}`,
      type: WarningType.Info
    });
  }

  if (cEnd < pEnd) {
    warnings.push({
      message: `Contract ends mid-period on ${new Date(contract.endDate!).toISOString().slice(0, 10)}`,
      type: WarningType.Warning
    });
  }

  // 2. Attendance & Worked Days Computation
  let workedDays = 0;
  let missingCheckoutCount = 0;

  for (const att of attendances) {
    const status = att.status;
    if (status === 'Present' || status === 'Overtime') {
      workedDays += 1.0;
    } else if (status === 'Late') {
      workedDays += 0.9; // count worked with slight late consideration or 1.0
    } else if (status === 'MissingCheckout') {
      workedDays += 1.0;
      missingCheckoutCount++;
    } else if (status === 'Absent') {
      // 0 days worked
    } else {
      workedDays += 1.0;
    }
  }

  if (missingCheckoutCount > 0) {
    warnings.push({
      message: `${missingCheckoutCount} attendance record(s) with missing check-out detected`,
      type: WarningType.Warning
    });
  }

  // If no attendance records provided, default to standard month worked days (e.g. 22 or 30 based on contract wage)
  if (attendances.length === 0) {
    workedDays = 22; // Standard default worked days
  }

  // Initialize Base Wage in scope
  computedValues['WAGE'] = contract.wage;
  computedValues['WORKED_DAYS'] = workedDays;

  // 3. Sequential Rule Execution
  for (const rule of rules) {
    const code = rule.code.toUpperCase();
    let amount = 0;

    switch (rule.computeType) {
      case ComputeType.Fixed: {
        // If rule code is BASIC and value is not specified or 0, fallback to contract.wage
        if ((code === 'BASIC' || code === 'BASE') && (!rule.value || rule.value === 0)) {
          amount = contract.wage;
        } else {
          amount = Number(rule.value || 0);
        }
        break;
      }

      case ComputeType.Percentage: {
        // Target can be defined in formula (e.g., "BASIC") or defaults to BASIC / WAGE
        const targetCode = (rule.formula?.trim().toUpperCase()) || 'BASIC';
        const baseAmount = computedValues[targetCode] ?? computedValues['WAGE'] ?? 0;

        if (computedValues[targetCode] === undefined && computedValues['WAGE'] === undefined) {
          throw new Error(
            `Percentage rule '${rule.name}' (${rule.code}) references '${targetCode}' which has not been calculated yet`
          );
        }

        const pct = Number(rule.value || 0);
        amount = Math.round((baseAmount * (pct / 100)) * 100) / 100;
        break;
      }

      case ComputeType.Formula: {
        if (!rule.formula) {
          throw new Error(`Formula rule '${rule.name}' (${rule.code}) is missing formula expression`);
        }

        try {
          amount = Math.round(SafeFormulaEvaluator.evaluate(rule.formula, computedValues) * 100) / 100;
        } catch (err: any) {
          throw new Error(
            `Failed executing formula for rule '${rule.name}' (${rule.code}): ${err.message}`
          );
        }
        break;
      }

      default:
        amount = Number(rule.value || 0);
    }

    computedValues[code] = amount;

    ruleLines.push({
      salaryRuleId: rule.id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      amount
    });
  }

  // 4. Summarize Gross and Net Totals — driven purely by category classification,
  //    NOT by matching a literal rule code/name. This keeps the payslip header
  //    figures mathematically correct no matter what the user calls their rules
  //    (e.g. a gross-aggregate rule named "TotalEarnings" instead of "GROSS").
  //
  //    Gross  = Σ (Basic + Allowance) earning components
  //    Net    = Gross − Σ (Deduction) components
  //
  //    "Gross" and "Net" category rules are the aggregate lines themselves, so
  //    they are intentionally excluded from these sums to avoid double-counting.
  const grossTotal = ruleLines
    .filter(l => l.category === RuleCategory.Basic || l.category === RuleCategory.Allowance)
    .reduce((sum, l) => sum + l.amount, 0);

  const totalDeductions = ruleLines
    .filter(l => l.category === RuleCategory.Deduction)
    .reduce((sum, l) => sum + l.amount, 0);

  const netTotal = grossTotal - totalDeductions;

  // Validate Net Total
  if (netTotal < 0) {
    warnings.push({
      message: `Computed net total is negative (${netTotal.toFixed(2)})`,
      type: WarningType.Warning
    });
  }

  return {
    workedDays,
    grossTotal: Math.round(grossTotal * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
    ruleLines,
    warnings,
    computedValues
  };
}
