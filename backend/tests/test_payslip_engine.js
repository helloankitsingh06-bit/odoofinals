const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  computePayslip,
  dryValidateStructure,
  evaluateFormula,
  calculateWorkedDays,
  validateContract,
  ComputationError,
} = require('../services/payslipComputationEngine');

async function expectComputationError(promise, messageRegex) {
  try {
    await promise;
    assert.fail('Expected computation to throw an error, but it succeeded');
  } catch (err) {
    if (err.code === 'ERR_ASSERTION' && err.message.includes('Expected computation to throw')) {
      throw err;
    }
    assert.ok(
      err instanceof ComputationError || err.statusCode === 400 || err.statusCode === 404,
      `Expected ComputationError, got ${err.name} (${err.message})`
    );
    if (messageRegex) {
      assert.ok(
        messageRegex.test(err.message),
        `Expected message to match ${messageRegex}, got "${err.message}"`
      );
    }
    return err;
  }
}

async function runTestSuite() {
  console.log('🧪 Starting Payslip Computation Engine Test Suite...\n');

  /* ------------------------------------------------------------------------ */
  /* 1. SAFE FORMULA EVALUATOR TESTS                                          */
  /* ------------------------------------------------------------------------ */
  console.log('--- 1. Testing Safe Formula Evaluator ---');

  const context = {
    BASIC: 50000,
    HRA: 20000,
    ALLOWANCE: 5000,
    PF: 6000,
  };

  // Precedence test: 20000 + 5000 * 2 = 30000
  const result1 = evaluateFormula('HRA + ALLOWANCE * 2', context, 'TEST1');
  assert.strictEqual(result1, 30000, 'Multiplication must take precedence over addition');
  console.log('  ✅ Operator precedence evaluated correctly (30000)');

  // Parentheses test: (20000 + 5000) * 2 = 50000
  const result2 = evaluateFormula('(HRA + ALLOWANCE) * 2', context, 'TEST2');
  assert.strictEqual(result2, 50000, 'Parentheses must override standard precedence');
  console.log('  ✅ Parentheses grouping evaluated correctly (50000)');

  // Built-in functions: min, max, round
  const minResult = evaluateFormula('min(BASIC * 0.12, 1800)', context, 'MIN_TEST');
  assert.strictEqual(minResult, 1800, 'min(6000, 1800) should return 1800');
  console.log('  ✅ Math function min() evaluated correctly (1800)');

  const maxResult = evaluateFormula('max(PF, 10000)', context, 'MAX_TEST');
  assert.strictEqual(maxResult, 10000, 'max(6000, 10000) should return 10000');
  console.log('  ✅ Math function max() evaluated correctly (10000)');

  // Fails loudly on undefined variable (no silent zero or NaN)
  assert.throws(
    () => {
      evaluateFormula('BASIC + UNKNOWN_VARIABLE', context, 'FAIL_TEST');
    },
    (err) => {
      assert.ok(err instanceof ComputationError);
      assert.match(err.message, /Variable "UNKNOWN_VARIABLE" is undefined/i);
      return true;
    },
    'Should throw error when referencing undefined variable'
  );
  console.log('  ✅ Fails loudly on undefined formula variable reference');

  // Fails on division by zero
  assert.throws(
    () => {
      evaluateFormula('BASIC / 0', context, 'DIV_ZERO');
    },
    (err) => {
      assert.ok(err instanceof ComputationError);
      assert.match(err.message, /Division by zero/i);
      return true;
    }
  );
  console.log('  ✅ Fails loudly on division by zero');

  /* ------------------------------------------------------------------------ */
  /* 2. DRY VALIDATE STRUCTURE TESTS (SAVE-TIME DEPENDENCY CHECK)             */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 2. Testing Dry Validate Structure ---');

  // Valid structure
  const validRules = [
    { code: 'BASIC', sequence: 10, computeType: 'Fixed', amount: 50000 },
    { code: 'HRA', sequence: 20, computeType: 'Percentage', percentage: 40, percentageOf: 'BASIC' },
    { code: 'NET', sequence: 30, computeType: 'Formula', formula: 'BASIC + HRA' },
  ];
  const validCheck = dryValidateStructure(validRules);
  assert.strictEqual(validCheck.isValid, true);
  assert.strictEqual(validCheck.errors.length, 0);
  console.log('  ✅ Valid structure passed dry validation');

  // Forward reference in Percentage rule: HRA (seq 10) references BASIC (seq 20)
  const forwardPctRules = [
    { code: 'HRA', sequence: 10, computeType: 'Percentage', percentage: 40, percentageOf: 'BASIC' },
    { code: 'BASIC', sequence: 20, computeType: 'Fixed', amount: 50000 },
  ];
  const forwardPctCheck = dryValidateStructure(forwardPctRules);
  assert.strictEqual(forwardPctCheck.isValid, false);
  assert.ok(forwardPctCheck.errors.some((e) => e.includes('Forward reference')));
  console.log('  ✅ Caught forward reference in Percentage rule during dry validation');

  // Forward reference in Formula rule: GROSS (seq 10) references BASIC (seq 20)
  const forwardFormulaRules = [
    { code: 'GROSS', sequence: 10, computeType: 'Formula', formula: 'BASIC * 1.5' },
    { code: 'BASIC', sequence: 20, computeType: 'Fixed', amount: 50000 },
  ];
  const forwardFormulaCheck = dryValidateStructure(forwardFormulaRules);
  assert.strictEqual(forwardFormulaCheck.isValid, false);
  assert.ok(forwardFormulaCheck.errors.some((e) => e.includes('Forward reference')));
  console.log('  ✅ Caught forward reference in Formula rule during dry validation');

  // Missing rule reference
  const missingRefRules = [
    { code: 'HRA', sequence: 10, computeType: 'Percentage', percentage: 40, percentageOf: 'NON_EXISTENT' },
  ];
  const missingRefCheck = dryValidateStructure(missingRefRules);
  assert.strictEqual(missingRefCheck.isValid, false);
  assert.ok(missingRefCheck.errors.some((e) => e.includes('does not exist')));
  console.log('  ✅ Caught missing reference during dry validation');

  /* ------------------------------------------------------------------------ */
  /* 3. CONTRACT VALIDATION TESTS                                             */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 3. Testing Contract Validation ---');

  const payrunPeriod = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
  };

  // Reject inactive / terminated contract
  await expectComputationError(
    computePayslip({
      employee: { id: 'emp_001', bankAccount: '1234567890' },
      contract: { id: 'cnt_001', status: 'Terminated', startDate: '2026-01-01' },
      salaryStructure: { id: 'struct_001', ruleIds: [] },
      salaryRules: validRules,
      period: payrunPeriod,
    }),
    /not Active \(current status: "Terminated"\)/i
  );
  console.log('  ✅ Rejected terminated contract');

  // Reject expired contract before payrun
  await expectComputationError(
    computePayslip({
      employee: { id: 'emp_001', bankAccount: '1234567890' },
      contract: { id: 'cnt_002', status: 'Active', startDate: '2025-01-01', endDate: '2026-08-31' },
      salaryStructure: { id: 'struct_001', ruleIds: [] },
      salaryRules: validRules,
      period: payrunPeriod,
    }),
    /expired before the payrun period/i
  );
  console.log('  ✅ Rejected contract that expired before the payrun period');

  // Flag mid-period start / end in warnings
  const midPeriodWarnings = [];
  validateContract(
    { id: 'cnt_003', status: 'Active', startDate: '2026-09-15', endDate: '2026-09-25' },
    payrunPeriod,
    midPeriodWarnings
  );
  assert.strictEqual(midPeriodWarnings.length, 2);
  assert.ok(midPeriodWarnings[0].includes('started mid-period'));
  assert.ok(midPeriodWarnings[1].includes('ending mid-period'));
  console.log('  ✅ Flagged mid-period start and end dates in warnings');

  /* ------------------------------------------------------------------------ */
  /* 4. ATTENDANCE & WORKED DAYS TESTS                                        */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 4. Testing Attendance & workedDays ---');

  const attendanceRecords = [
    { date: '2026-09-01', status: 'Present' },
    { date: '2026-09-02', status: 'Present' },
    { date: '2026-09-03', status: 'Late' },      // Counted as 1 worked day
    { date: '2026-09-04', status: 'Overtime' },  // Counted as 1 worked day
    { date: '2026-09-05', status: 'Absent' },    // Not worked
    { date: '2026-09-06', status: 'MissingCheckout' }, // Counted as 1 worked day + warning
    { date: '2026-09-07', status: 'HalfDay' },   // Counted as 0.5 worked day
  ];

  const attWarnings = [];
  const worked = calculateWorkedDays(attendanceRecords, payrunPeriod, attWarnings);
  // 1 (Present) + 1 (Present) + 1 (Late) + 1 (Overtime) + 0 (Absent) + 1 (MissingCheckout) + 0.5 (HalfDay) = 5.5
  assert.strictEqual(worked, 5.5);
  assert.strictEqual(attWarnings.length, 1);
  assert.ok(attWarnings[0].includes('MissingCheckout'));
  console.log('  ✅ Calculated workedDays (5.5) and flagged MissingCheckout warning');

  /* ------------------------------------------------------------------------ */
  /* 5. NORMAL CASE PAYSLIP COMPUTATION END-TO-END                            */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 5. Testing Normal Case Payslip Computation End-to-End ---');

  const fullRules = [
    {
      id: 'rule_basic',
      name: 'Basic Pay',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computeType: 'Fixed',
      amount: 50000,
    },
    {
      id: 'rule_hra',
      name: 'House Rent Allowance',
      code: 'HRA',
      category: 'Allowance',
      sequence: 20,
      computeType: 'Percentage',
      percentage: 40,
      percentageOf: 'BASIC',
    },
    {
      id: 'rule_special',
      name: 'Special Allowance',
      code: 'SPECIAL',
      category: 'Allowance',
      sequence: 25,
      computeType: 'Fixed',
      amount: 10000,
    },
    {
      id: 'rule_pf',
      name: 'Provident Fund',
      code: 'PF',
      category: 'Deduction',
      sequence: 30,
      computeType: 'Percentage',
      percentage: 12,
      percentageOf: 'BASIC',
    },
    {
      id: 'rule_tax',
      name: 'Professional Tax',
      code: 'PTAX',
      category: 'Deduction',
      sequence: 35,
      computeType: 'Formula',
      formula: 'min(BASIC * 0.05, 2500)', // min(2500, 2500) = 2500
    },
    {
      id: 'rule_gross',
      name: 'Gross Total',
      code: 'GROSS',
      category: 'Gross',
      sequence: 40,
      computeType: 'Formula',
      formula: 'BASIC + HRA + SPECIAL',
    },
    {
      id: 'rule_net',
      name: 'Net Pay',
      code: 'NET',
      category: 'Net',
      sequence: 50,
      computeType: 'Formula',
      formula: 'GROSS - (PF + PTAX)',
    },
  ];

  const fullStructure = {
    id: 'struct_software_eng',
    name: 'Software Engineer Grade 2',
    ruleIds: fullRules.map((r) => r.id),
  };

  const normalEmployee = {
    id: 'emp_ankit',
    name: 'Ankit Singh',
    bankAccount: 'HDFC0001234567',
  };

  const normalContract = {
    id: 'cnt_ankit_2026',
    status: 'Active',
    startDate: '2026-01-01',
    salaryStructureId: fullStructure.id,
  };

  const normalAttendance = [
    { date: '2026-09-01', status: 'Present' },
    { date: '2026-09-02', status: 'Present' },
    { date: '2026-09-03', status: 'Late' },
    { date: '2026-09-04', status: 'Present' },
  ];

  const payslip = await computePayslip({
    employee: normalEmployee,
    contract: normalContract,
    salaryStructure: fullStructure,
    salaryRules: fullRules,
    attendanceRecords: normalAttendance,
    workingSchedule: { scheduledDays: 22 },
    period: payrunPeriod,
  });

  // Expected breakdown:
  // BASIC: 50000
  // HRA: 40% of 50000 = 20000
  // SPECIAL: 10000
  // PF: 12% of 50000 = 6000
  // PTAX: min(2500, 2500) = 2500
  // GROSS: 50000 + 20000 + 10000 = 80000
  // NET: 80000 - (6000 + 2500) = 71500
  assert.strictEqual(payslip.grossTotal, 80000);
  assert.strictEqual(payslip.netTotal, 71500);
  assert.strictEqual(payslip.workedDays, 4);
  assert.strictEqual(payslip.ruleBreakdown.length, 7);

  const basicBreakdown = payslip.ruleBreakdown.find((r) => r.code === 'BASIC');
  assert.strictEqual(basicBreakdown.amount, 50000);

  const hraBreakdown = payslip.ruleBreakdown.find((r) => r.code === 'HRA');
  assert.strictEqual(hraBreakdown.amount, 20000);

  const pfBreakdown = payslip.ruleBreakdown.find((r) => r.code === 'PF');
  assert.strictEqual(pfBreakdown.amount, 6000);

  const netBreakdown = payslip.ruleBreakdown.find((r) => r.code === 'NET');
  assert.strictEqual(netBreakdown.amount, 71500);

  console.log('  ✅ Normal payslip computed accurately:');
  console.log(`     Gross: ₹${payslip.grossTotal} | Net: ₹${payslip.netTotal} | Worked Days: ${payslip.workedDays}`);

  /* ------------------------------------------------------------------------ */
  /* 6. PRORATION TEST                                                        */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 6. Testing Proration Logic ---');

  const proratedRules = [
    {
      id: 'rule_basic_prorated',
      name: 'Basic Pay',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computeType: 'Fixed',
      amount: 44000,
      isProratable: true, // Prorated based on workedDays vs scheduledDays
    },
  ];

  const proratedPayslip = await computePayslip({
    employee: normalEmployee,
    contract: normalContract,
    salaryStructure: { id: 'struct_prorate', ruleIds: ['rule_basic_prorated'] },
    salaryRules: proratedRules,
    attendanceRecords: [
      { date: '2026-09-01', status: 'Present' },
      { date: '2026-09-02', status: 'Present' },
      // 2 worked days out of 22 scheduled days -> 2/22 = 1/11th of 44000 = 4000
    ],
    workingSchedule: { scheduledDays: 22 },
    period: payrunPeriod,
  });

  assert.strictEqual(proratedPayslip.workedDays, 2);
  assert.strictEqual(proratedPayslip.grossTotal, 4000);
  console.log('  ✅ Proration verified: 2 days / 22 days of ₹44,000 = ₹4,000');

  /* ------------------------------------------------------------------------ */
  /* 7. WARNINGS AUDIT TEST (MISSING BANK DETAILS & ATTENDANCE WARNINGS)      */
  /* ------------------------------------------------------------------------ */
  console.log('\n--- 7. Testing Audit Warnings Generation ---');

  const unbankedEmployee = {
    id: 'emp_no_bank',
    name: 'Unbanked Employee',
  };

  const payslipWithWarnings = await computePayslip({
    employee: unbankedEmployee,
    contract: normalContract,
    salaryStructure: fullStructure,
    salaryRules: fullRules,
    attendanceRecords: [
      { date: '2026-09-01', status: 'MissingCheckout' },
    ],
    workingSchedule: { scheduledDays: 22 },
    period: payrunPeriod,
  });

  assert.ok(
    payslipWithWarnings.warnings.some((w) => w.includes('missing bank details')),
    'Must include warning about missing bank details'
  );
  assert.ok(
    payslipWithWarnings.warnings.some((w) => w.includes('MissingCheckout')),
    'Must include warning about MissingCheckout attendance'
  );
  console.log('  ✅ Audit warnings captured correctly:');
  payslipWithWarnings.warnings.forEach((w) => console.log(`     ⚠️  ${w}`));

  console.log('\n🎉 ALL PAYSLIP COMPUTATION ENGINE TESTS PASSED! 🚀');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE RUNNER FAILED:', err);
  process.exit(1);
});
