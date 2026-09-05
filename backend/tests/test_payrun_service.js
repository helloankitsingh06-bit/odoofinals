const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { db } = require('../firebase');
const salaryRuleService = require('../services/salaryRuleService');
const salaryStructureService = require('../services/salaryStructureService');
const payrunService = require('../services/payrunService');
const { PAYRUN_STATUS } = payrunService;

async function expectServiceError(promise, expectedStatusCode, messageRegex) {
  try {
    await promise;
    assert.fail('Expected promise to reject, but it succeeded');
  } catch (err) {
    if (err.code === 'ERR_ASSERTION' && err.message.includes('Expected promise to reject')) {
      throw err;
    }
    assert.strictEqual(
      err.statusCode,
      expectedStatusCode,
      `Expected statusCode ${expectedStatusCode}, got ${err.statusCode} (Error: ${err.message})`
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

async function runTests() {
  console.log('🧪 Starting Payrun Service Test Suite...\n');

  const uniqueSuffix = Date.now().toString().slice(-6);
  const createdRuleIds = [];
  let createdStructureId = null;
  const createdEmployeeIds = [];
  const createdContractIds = [];
  const createdAttendanceIds = [];
  const createdPayrunIds = [];

  try {
    /* ------------------------------------------------------------------------ */
    /* 1. SETUP PREREQUISITES (Rules, Structure, Employees, Contracts)          */
    /* ------------------------------------------------------------------------ */
    console.log('--- 1. Setting Up Test Data ---');

    // Create Rule: Basic Pay
    const basicRule = await salaryRuleService.createSalaryRule({
      name: 'Basic Pay',
      code: `BASIC_${uniqueSuffix}`,
      category: 'Basic',
      sequence: 10,
      computeType: 'Fixed',
      amount: 60000,
    });
    createdRuleIds.push(basicRule.id);

    // Create Rule: HRA (30% of Basic)
    const hraRule = await salaryRuleService.createSalaryRule({
      name: 'HRA',
      code: `HRA_${uniqueSuffix}`,
      category: 'Allowance',
      sequence: 20,
      computeType: 'Percentage',
      percentage: 30,
      percentageOf: basicRule.code,
    });
    createdRuleIds.push(hraRule.id);

    // Create Salary Structure
    const structure = await salaryStructureService.createSalaryStructure({
      name: `Structure ${uniqueSuffix}`,
      ruleIds: [basicRule.id, hraRule.id],
    });
    createdStructureId = structure.id;
    console.log(`  ✅ Created Structure: ${structure.name} (ID: ${structure.id})`);

    const payrunPeriod = {
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    };

    // Employee 1: Eligible (Active, matching contract, covering period)
    const emp1Ref = await db.collection('employees').add({
      name: 'Eligible Employee',
      status: 'Active',
      bankAccount: 'HDFC123456789',
      createdAt: new Date(),
    });
    const emp1Id = emp1Ref.id;
    createdEmployeeIds.push(emp1Id);

    const contract1Ref = await db.collection('contracts').add({
      employeeId: emp1Id,
      salaryStructureId: structure.id,
      status: 'Active',
      startDate: '2026-01-01',
      createdAt: new Date(),
    });
    createdContractIds.push(contract1Ref.id);

    // Employee 2: Ineligible (Inactive / Terminated status)
    const emp2Ref = await db.collection('employees').add({
      name: 'Terminated Employee',
      status: 'Terminated',
      createdAt: new Date(),
    });
    const emp2Id = emp2Ref.id;
    createdEmployeeIds.push(emp2Id);

    const contract2Ref = await db.collection('contracts').add({
      employeeId: emp2Id,
      salaryStructureId: structure.id,
      status: 'Active',
      startDate: '2026-01-01',
      createdAt: new Date(),
    });
    createdContractIds.push(contract2Ref.id);

    // Employee 3: Ineligible (Contract expired before period)
    const emp3Ref = await db.collection('employees').add({
      name: 'Expired Contract Employee',
      status: 'Active',
      createdAt: new Date(),
    });
    const emp3Id = emp3Ref.id;
    createdEmployeeIds.push(emp3Id);

    const contract3Ref = await db.collection('contracts').add({
      employeeId: emp3Id,
      salaryStructureId: structure.id,
      status: 'Active',
      startDate: '2025-01-01',
      endDate: '2026-09-30', // Expired before October
      createdAt: new Date(),
    });
    createdContractIds.push(contract3Ref.id);

    // Add Attendance for Employee 1 (including a MissingCheckout day for audit)
    const att1Ref = await db.collection('attendances').add({
      employeeId: emp1Id,
      date: '2026-10-01',
      status: 'Present',
    });
    createdAttendanceIds.push(att1Ref.id);

    const att2Ref = await db.collection('attendances').add({
      employeeId: emp1Id,
      date: '2026-10-02',
      status: 'MissingCheckout', // Should flag warning
    });
    createdAttendanceIds.push(att2Ref.id);

    console.log('  ✅ Test data initialized');

    /* ------------------------------------------------------------------------ */
    /* 2. WIZARD STEP 1 -> STEP 2 ELIGIBILITY FILTER                            */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 2. Testing Wizard Step 1 -> Step 2 Eligibility Query ---');

    const eligible = await payrunService.getEligibleEmployeesForPayrun({
      salaryStructureId: structure.id,
      period: payrunPeriod,
    });

    assert.ok(Array.isArray(eligible));
    assert.strictEqual(eligible.length, 1, 'Only Employee 1 should be eligible');
    assert.strictEqual(eligible[0].id, emp1Id);
    assert.strictEqual(eligible[0].activeContract.salaryStructureId, structure.id);
    console.log(`  ✅ Correctly filtered eligible employees (${eligible.length} found: ${eligible[0].name})`);

    /* ------------------------------------------------------------------------ */
    /* 3. STEP 2: CREATE PAYRUN (DRAFT STATUS)                                  */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 3. Testing Payrun Creation (Draft) ---');

    const payrun = await payrunService.createPayrun({
      name: `October 2026 Payrun ${uniqueSuffix}`,
      salaryStructureId: structure.id,
      period: payrunPeriod,
      employeeIds: [emp1Id],
    });
    createdPayrunIds.push(payrun.id);

    assert.strictEqual(payrun.status, PAYRUN_STATUS.DRAFT);
    assert.strictEqual(payrun.totalEmployees, 1);
    assert.deepStrictEqual(payrun.employeeIds, [emp1Id]);
    console.log(`  ✅ Created Payrun in Draft status: ${payrun.name} (ID: ${payrun.id})`);

    /* ------------------------------------------------------------------------ */
    /* 4. STATE MACHINE GUARDS (REJECT INVALID JUMPS)                           */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 4. Testing State Machine Transition Guards ---');

    // Cannot jump Draft -> Validated directly
    await expectServiceError(
      payrunService.validatePayrun(payrun.id),
      400,
      /invalid status transition/i
    );
    console.log('  ✅ Blocked illegal transition: Draft -> Validated');

    // Cannot jump Draft -> Paid directly
    await expectServiceError(
      payrunService.markPayrunPaid(payrun.id, { userRole: 'Admin' }),
      400,
      /invalid status transition/i
    );
    console.log('  ✅ Blocked illegal transition: Draft -> Paid');

    /* ------------------------------------------------------------------------ */
    /* 5. COMPUTE PAYRUN & IDEMPOTENCY                                          */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 5. Testing Compute Payrun & Idempotency ---');

    const computedPayrun = await payrunService.computePayrun(payrun.id);
    assert.strictEqual(computedPayrun.status, PAYRUN_STATUS.COMPUTED);
    // Basic: 60000, HRA: 30% of 60000 = 18000 -> Gross: 78000, Net: 78000
    assert.strictEqual(computedPayrun.totalGross, 78000);
    assert.strictEqual(computedPayrun.totalNet, 78000);
    console.log(`  ✅ Computed Payrun: Gross ₹${computedPayrun.totalGross} | Net ₹${computedPayrun.totalNet}`);

    const payslips = await payrunService.getPayslipsByPayrunId(payrun.id);
    assert.strictEqual(payslips.length, 1);
    assert.strictEqual(payslips[0].id, `${payrun.id}_${emp1Id}`);
    assert.strictEqual(payslips[0].grossTotal, 78000);
    assert.strictEqual(payslips[0].netTotal, 78000);
    console.log('  ✅ Verified generated payslip matches expected totals');

    // Test Idempotency: Re-running computePayrun must overwrite, NOT create duplicates
    const recomputedPayrun = await payrunService.computePayrun(payrun.id);
    assert.strictEqual(recomputedPayrun.status, PAYRUN_STATUS.COMPUTED);
    const payslipsAfterRecompute = await payrunService.getPayslipsByPayrunId(payrun.id);
    assert.strictEqual(
      payslipsAfterRecompute.length,
      1,
      'Re-computing must be idempotent and not duplicate payslips'
    );
    console.log('  ✅ Verified computePayrun is strictly idempotent (1 payslip preserved)');

    /* ------------------------------------------------------------------------ */
    /* 6. VALIDATE PAYRUN & WARNINGS ROLL-UP                                    */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 6. Testing Validate Payrun & Warnings Roll-Up ---');

    const validatedPayrun = await payrunService.validatePayrun(payrun.id);
    assert.strictEqual(validatedPayrun.status, PAYRUN_STATUS.VALIDATED);
    assert.ok(validatedPayrun.warningSummary, 'Payrun should contain warningSummary');
    assert.ok(
      validatedPayrun.warningSummary.warnings.some((w) =>
        w.warnings.some((msg) => msg.includes('MissingCheckout'))
      ),
      'Must roll up MissingCheckout warning'
    );
    console.log(`  ✅ Validated Payrun: Status "${validatedPayrun.status}", Total rolled-up warnings: ${validatedPayrun.warningSummary.totalWarnings}`);

    /* ------------------------------------------------------------------------ */
    /* 7. RBAC GUARD & MARK PAID                                                */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 7. Testing RBAC & Mark Paid ---');

    // Unauthorized role (e.g. Employee) must be rejected with HTTP 403
    await expectServiceError(
      payrunService.markPayrunPaid(payrun.id, { userRole: 'Employee' }),
      403,
      /Unauthorized: Only HRPayrollManager or Admin/i
    );
    console.log('  ✅ Blocked unauthorized role (Employee) with HTTP 403');

    // Authorized role: HRPayrollManager
    const paidPayrun = await payrunService.markPayrunPaid(payrun.id, {
      userRole: 'HRPayrollManager',
      userId: 'manager_123',
    });
    assert.strictEqual(paidPayrun.status, PAYRUN_STATUS.PAID);
    assert.ok(paidPayrun.paidAt, 'paidAt timestamp must be set');
    console.log(`  ✅ Successfully transitioned to Paid by HRPayrollManager at ${paidPayrun.paidAt}`);

    // Verify child payslips flipped to Paid
    const paidPayslips = await payrunService.getPayslipsByPayrunId(payrun.id);
    assert.strictEqual(paidPayslips[0].status, PAYRUN_STATUS.PAID);
    assert.ok(paidPayslips[0].paidAt, 'Payslip paidAt must be set');
    console.log('  ✅ All child payslips successfully updated to "Paid"');

    // Cannot reopen Paid payrun
    await expectServiceError(
      payrunService.reopenPayrun(payrun.id),
      400,
      /Cannot reopen a payrun that has already been Paid/i
    );
    console.log('  ✅ Blocked reopening an already Paid payrun');

    /* ------------------------------------------------------------------------ */
    /* 8. REOPEN PATH VERIFICATION (VALIDATED -> DRAFT)                         */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 8. Testing Reopen Path (Validated -> Draft) ---');

    const payrun2 = await payrunService.createPayrun({
      name: `Reopen Test Payrun ${uniqueSuffix}`,
      salaryStructureId: structure.id,
      period: payrunPeriod,
      employeeIds: [emp1Id],
    });
    createdPayrunIds.push(payrun2.id);

    await payrunService.computePayrun(payrun2.id);
    await payrunService.validatePayrun(payrun2.id);

    const reopened = await payrunService.reopenPayrun(payrun2.id);
    assert.strictEqual(reopened.status, PAYRUN_STATUS.DRAFT);
    console.log('  ✅ Successfully reopened payrun from Validated back to Draft');

    console.log('\n🎉 ALL PAYRUN SERVICE TESTS PASSED! 🚀');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    console.log('\n🧹 Cleaning up test documents...');
    for (const pId of createdPayrunIds) {
      await payrunService.deletePayrun(pId).catch(() => {});
    }
    for (const aId of createdAttendanceIds) {
      await db.collection('attendances').doc(aId).delete().catch(() => {});
    }
    for (const cId of createdContractIds) {
      await db.collection('contracts').doc(cId).delete().catch(() => {});
    }
    for (const eId of createdEmployeeIds) {
      await db.collection('employees').doc(eId).delete().catch(() => {});
    }
    if (createdStructureId) {
      await salaryStructureService.deleteSalaryStructure(createdStructureId).catch(() => {});
    }
    for (const rId of createdRuleIds) {
      await salaryRuleService.deleteSalaryRule(rId).catch(() => {});
    }
    console.log('  ✅ Cleanup complete');
  }
}

runTests();
