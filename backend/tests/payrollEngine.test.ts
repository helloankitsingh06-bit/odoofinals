import { describe, it, expect } from 'vitest';
import {
  computeEmployeePayslip,
  validateSalaryStructureRules,
  SafeFormulaEvaluator,
  RuleDefinition,
  ContractInfo
} from '../src/services/payrollEngine';
import { RuleCategory, ComputeType, WarningType } from '../src/types';

describe('SafeFormulaEvaluator', () => {
  it('evaluates basic arithmetic expressions correctly', () => {
    const scope = { BASIC: 5000, HRA: 1000, PF: 600, TAX: 400 };
    expect(SafeFormulaEvaluator.evaluate('BASIC + HRA', scope)).toBe(6000);
    expect(SafeFormulaEvaluator.evaluate('BASIC + HRA - PF - TAX', scope)).toBe(5000);
    expect(SafeFormulaEvaluator.evaluate('(BASIC * 0.10) + 200', scope)).toBe(700);
    expect(SafeFormulaEvaluator.evaluate('BASIC / 2 + 100 * 3', scope)).toBe(2800);
  });

  it('throws an error when referencing an undefined or future variable', () => {
    const scope = { BASIC: 5000 };
    expect(() => SafeFormulaEvaluator.evaluate('BASIC + FUTURE_BONUS', scope)).toThrow(
      /Referenced rule variable 'FUTURE_BONUS' has not been computed yet/
    );
  });
});

describe('Salary Structure Dry-Run Validator', () => {
  it('validates correct rule order without errors', () => {
    const rules: RuleDefinition[] = [
      { id: '1', name: 'Basic', code: 'BASIC', category: RuleCategory.Basic, sequence: 1, computeType: ComputeType.Fixed, value: 5000 },
      { id: '2', name: 'HRA', code: 'HRA', category: RuleCategory.Allowance, sequence: 2, computeType: ComputeType.Percentage, value: 20, formula: 'BASIC' },
      { id: '3', name: 'Gross', code: 'GROSS', category: RuleCategory.Gross, sequence: 3, computeType: ComputeType.Formula, formula: 'BASIC + HRA' }
    ];

    const result = validateSalaryStructureRules(rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects forward references and circular dependencies', () => {
    const rules: RuleDefinition[] = [
      { id: '1', name: 'Gross', code: 'GROSS', category: RuleCategory.Gross, sequence: 1, computeType: ComputeType.Formula, formula: 'BASIC + HRA' },
      { id: '2', name: 'Basic', code: 'BASIC', category: RuleCategory.Basic, sequence: 2, computeType: ComputeType.Fixed, value: 5000 },
      { id: '3', name: 'HRA', code: 'HRA', category: RuleCategory.Allowance, sequence: 3, computeType: ComputeType.Percentage, value: 20, formula: 'BASIC' }
    ];

    const result = validateSalaryStructureRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("references 'BASIC' before it is computed");
  });
});

describe('Salary Computation Engine', () => {
  const dummyContract: ContractInfo = {
    id: 'c1',
    employeeId: 'emp1',
    wage: 6000,
    startDate: new Date('2026-01-01'),
    endDate: null,
    status: 'Active',
    salaryStructureId: 's1'
  };

  const sampleRules: RuleDefinition[] = [
    { id: 'r1', name: 'Basic Salary', code: 'BASIC', category: RuleCategory.Basic, sequence: 1, computeType: ComputeType.Fixed, value: 6000 },
    { id: 'r2', name: 'House Rent Allowance', code: 'HRA', category: RuleCategory.Allowance, sequence: 2, computeType: ComputeType.Percentage, value: 25, formula: 'BASIC' },
    { id: 'r3', name: 'Special Allowance', code: 'SPL_ALLOW', category: RuleCategory.Allowance, sequence: 3, computeType: ComputeType.Fixed, value: 500 },
    { id: 'r4', name: 'Gross Pay', code: 'GROSS', category: RuleCategory.Gross, sequence: 4, computeType: ComputeType.Formula, formula: 'BASIC + HRA + SPL_ALLOW' },
    { id: 'r5', name: 'Provident Fund', code: 'PF', category: RuleCategory.Deduction, sequence: 5, computeType: ComputeType.Percentage, value: 12, formula: 'BASIC' },
    { id: 'r6', name: 'Professional Tax', code: 'PTAX', category: RuleCategory.Deduction, sequence: 6, computeType: ComputeType.Fixed, value: 200 },
    { id: 'r7', name: 'Net Pay', code: 'NET', category: RuleCategory.Net, sequence: 7, computeType: ComputeType.Formula, formula: 'GROSS - PF - PTAX' }
  ];

  it('computes exact payslip breakdown for standard employee', () => {
    const result = computeEmployeePayslip({
      employee: { id: 'emp1', name: 'Alice Developer', department: 'Engineering', jobPosition: 'Senior Engineer' },
      contract: dummyContract,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      rules: sampleRules
    });

    // Calculations:
    // BASIC = 6000
    // HRA = 6000 * 0.25 = 1500
    // SPL_ALLOW = 500
    // GROSS = 6000 + 1500 + 500 = 8000
    // PF = 6000 * 0.12 = 720
    // PTAX = 200
    // NET = 8000 - 720 - 200 = 7080
    expect(result.computedValues['BASIC']).toBe(6000);
    expect(result.computedValues['HRA']).toBe(1500);
    expect(result.computedValues['SPL_ALLOW']).toBe(500);
    expect(result.grossTotal).toBe(8000);
    expect(result.computedValues['PF']).toBe(720);
    expect(result.computedValues['PTAX']).toBe(200);
    expect(result.netTotal).toBe(7080);
    expect(result.ruleLines).toHaveLength(7);
  });

  it('flags warning when attendance contains missing check-outs', () => {
    const result = computeEmployeePayslip({
      employee: { id: 'emp1', name: 'Bob Smith', department: 'Sales', jobPosition: 'Executive' },
      contract: dummyContract,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      attendances: [
        { id: 'a1', employeeId: 'emp1', checkIn: new Date(), checkOut: new Date(), workedHours: 8, status: 'Present' },
        { id: 'a2', employeeId: 'emp1', checkIn: new Date(), checkOut: null, workedHours: 8, status: 'MissingCheckout' }
      ],
      rules: sampleRules
    });

    const missingCheckoutWarning = result.warnings.find(w => w.message.includes('missing check-out'));
    expect(missingCheckoutWarning).toBeDefined();
    expect(missingCheckoutWarning?.type).toBe(WarningType.Warning);
  });

  it('flags warning for inactive contract', () => {
    const expiredContract = { ...dummyContract, status: 'Expired' };
    const result = computeEmployeePayslip({
      employee: { id: 'emp1', name: 'Bob Smith', department: 'Sales', jobPosition: 'Executive' },
      contract: expiredContract,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      rules: sampleRules
    });

    const inactiveWarning = result.warnings.find(w => w.message.includes('not Active'));
    expect(inactiveWarning).toBeDefined();
  });

  it('computes unpaid leave deductions and overtime pay correctly using built-in variables', () => {
    const rulesWithUnpaidAndOvertime: RuleDefinition[] = [
      { id: 'r1', name: 'Basic Salary', code: 'BASIC', category: RuleCategory.Basic, sequence: 1, computeType: ComputeType.Fixed, value: 30000 },
      { id: 'r2', name: 'Overtime Pay', code: 'OVERTIME', category: RuleCategory.Allowance, sequence: 2, computeType: ComputeType.Formula, formula: 'OVERTIME_HOURS * (BASIC / 160) * 1.5' },
      { id: 'r3', name: 'Gross Pay', code: 'GROSS', category: RuleCategory.Gross, sequence: 3, computeType: ComputeType.Formula, formula: 'BASIC + OVERTIME' },
      { id: 'r4', name: 'Unpaid Leave Deduction', code: 'UNPAID_LEAVE', category: RuleCategory.Deduction, sequence: 4, computeType: ComputeType.Formula, formula: 'UNPAID_LEAVE_DAYS * (BASIC / 30)' },
      { id: 'r5', name: 'Net Pay', code: 'NET', category: RuleCategory.Net, sequence: 5, computeType: ComputeType.Formula, formula: 'GROSS - UNPAID_LEAVE' }
    ];

    const result = computeEmployeePayslip({
      employee: { id: 'emp1', name: 'Kevin', department: 'Engineering', jobPosition: 'Developer' },
      contract: { ...dummyContract, wage: 30000 },
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      attendances: [
        { id: 'a1', employeeId: 'emp1', checkIn: new Date('2026-09-01T09:00:00Z'), checkOut: new Date('2026-09-01T20:30:00Z'), workedHours: 10.5, status: 'Overtime' }
      ],
      unpaidLeaveDays: 2,
      rules: rulesWithUnpaidAndOvertime
    });

    // Overtime: 2.5 hours * (30000 / 160) * 1.5 = 2.5 * 187.5 * 1.5 = 703.125 -> 703.13
    // Gross: 30000 + 703.13 = 30703.13
    // Unpaid Leave: 2 * (30000 / 30) = 2000
    // Net: 30703.13 - 2000 = 28703.13
    expect(result.computedValues['UNPAID_LEAVE_DAYS']).toBe(2);
    expect(result.computedValues['OVERTIME_HOURS']).toBe(2.5);
    expect(result.computedValues['OVERTIME']).toBe(703.13);
    expect(result.computedValues['UNPAID_LEAVE']).toBe(2000);
    expect(result.netTotal).toBe(28703.13);
  });
});
