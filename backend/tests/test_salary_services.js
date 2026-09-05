const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import services
const salaryRuleService = require('../services/salaryRuleService');
const salaryStructureService = require('../services/salaryStructureService');

async function expectError(promise, expectedStatusCode, messageRegex) {
  try {
    await promise;
    assert.fail('Expected promise to reject, but it resolved successfully');
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
  console.log('🧪 Starting Salary Rule & Salary Structure Test Suite...\n');

  const createdRuleIds = [];
  let createdStructureId = null;
  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    /* ------------------------------------------------------------------------ */
    /* 1. SALARY RULE VALIDATION TESTS                                          */
    /* ------------------------------------------------------------------------ */
    console.log('--- 1. Testing SalaryRule Input Validations ---');

    // Reject negative sequence
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Negative Sequence Test',
        code: `TEST_NEG_${uniqueSuffix}`,
        category: 'Allowance',
        sequence: -1,
        computeType: 'Fixed',
        amount: 1000,
      }),
      400,
      /cannot be negative/i
    );
    console.log('  ✅ Rejected negative sequence correctly');

    // Reject non-integer sequence
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Float Sequence Test',
        code: `TEST_FLOAT_${uniqueSuffix}`,
        category: 'Allowance',
        sequence: 1.5,
        computeType: 'Fixed',
        amount: 1000,
      }),
      400,
      /must be an integer/i
    );
    console.log('  ✅ Rejected non-integer sequence correctly');

    // Reject invalid category
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Invalid Category Test',
        code: `TEST_CAT_${uniqueSuffix}`,
        category: 'InvalidCategory',
        sequence: 1,
        computeType: 'Fixed',
        amount: 1000,
      }),
      400,
      /must be one of/i
    );
    console.log('  ✅ Rejected invalid category correctly');

    // Reject invalid computeType
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Invalid Compute Type',
        code: `TEST_COMP_${uniqueSuffix}`,
        category: 'Basic',
        sequence: 1,
        computeType: 'UnknownType',
      }),
      400,
      /must be one of/i
    );
    console.log('  ✅ Rejected invalid computeType correctly');

    // Reject Percentage computeType without percentageOf
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Missing percentageOf',
        code: `TEST_PCT_${uniqueSuffix}`,
        category: 'Allowance',
        sequence: 2,
        computeType: 'Percentage',
        percentage: 20,
      }),
      400,
      /is required/i
    );
    console.log('  ✅ Rejected Percentage rule missing target code correctly');

    // Reject Fixed computeType without amount
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Missing Fixed Amount',
        code: `TEST_FIX_${uniqueSuffix}`,
        category: 'Basic',
        sequence: 1,
        computeType: 'Fixed',
      }),
      400,
      /is required/i
    );
    console.log('  ✅ Rejected Fixed rule missing amount correctly');

    /* ------------------------------------------------------------------------ */
    /* 2. SALARY RULE CREATION & UNIQUENESS TESTS                               */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 2. Testing SalaryRule Creation & Uniqueness ---');

    // Create Rule 1: BASIC (Fixed)
    const basicCode = `BASIC_${uniqueSuffix}`;
    const basicRule = await salaryRuleService.createSalaryRule({
      name: 'Basic Salary',
      code: basicCode,
      category: 'Basic',
      sequence: 10,
      computeType: 'Fixed',
      amount: 50000,
      description: 'Core basic pay',
    });
    createdRuleIds.push(basicRule.id);
    assert.ok(basicRule.id, 'Rule ID should be generated');
    assert.strictEqual(basicRule.code, basicCode);
    assert.strictEqual(basicRule.sequence, 10);
    assert.strictEqual(basicRule.amount, 50000);
    console.log(`  ✅ Created Fixed rule: ${basicRule.code} (ID: ${basicRule.id})`);

    // Reject duplicate rule code
    await expectError(
      salaryRuleService.createSalaryRule({
        name: 'Duplicate Basic Rule',
        code: basicCode.toLowerCase(), // should normalize and detect collision
        category: 'Basic',
        sequence: 11,
        computeType: 'Fixed',
        amount: 60000,
      }),
      409,
      /already exists/i
    );
    console.log('  ✅ Rejected duplicate rule code correctly (HTTP 409)');

    // Create Rule 2: HRA (Percentage of BASIC)
    const hraCode = `HRA_${uniqueSuffix}`;
    const hraRule = await salaryRuleService.createSalaryRule({
      name: 'House Rent Allowance',
      code: hraCode,
      category: 'Allowance',
      sequence: 20,
      computeType: 'Percentage',
      percentage: 40,
      percentageOf: basicCode,
    });
    createdRuleIds.push(hraRule.id);
    assert.strictEqual(hraRule.percentage, 40);
    assert.strictEqual(hraRule.percentageOf, basicCode);
    console.log(`  ✅ Created Percentage rule: ${hraRule.code} (ID: ${hraRule.id})`);

    // Create Rule 3: GROSS (Formula)
    const grossCode = `GROSS_${uniqueSuffix}`;
    const grossRule = await salaryRuleService.createSalaryRule({
      name: 'Gross Pay',
      code: grossCode,
      category: 'Gross',
      sequence: 30,
      computeType: 'Formula',
      formula: `${basicCode} + ${hraCode}`,
    });
    createdRuleIds.push(grossRule.id);
    assert.strictEqual(grossRule.formula, `${basicCode} + ${hraCode}`);
    console.log(`  ✅ Created Formula rule: ${grossRule.code} (ID: ${grossRule.id})`);

    /* ------------------------------------------------------------------------ */
    /* 3. SALARY RULE RETRIEVAL & UPDATE TESTS                                  */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 3. Testing SalaryRule Get & Update ---');

    const fetchedByCode = await salaryRuleService.getSalaryRuleByCode(basicCode);
    assert.strictEqual(fetchedByCode.id, basicRule.id);
    assert.strictEqual(fetchedByCode.code, basicCode);
    console.log('  ✅ Retrieved rule by unique code successfully');

    const updatedHra = await salaryRuleService.updateSalaryRule(hraRule.id, {
      percentage: 50,
      description: 'Updated to 50% for metro city',
    });
    assert.strictEqual(updatedHra.percentage, 50);
    assert.strictEqual(updatedHra.description, 'Updated to 50% for metro city');
    console.log('  ✅ Updated rule successfully');

    const allRules = await salaryRuleService.getSalaryRules();
    assert.ok(Array.isArray(allRules));
    console.log(`  ✅ getSalaryRules returned ${allRules.length} rules (sorted by sequence)`);

    /* ------------------------------------------------------------------------ */
    /* 4. SALARY STRUCTURE VALIDATION & CREATION TESTS                          */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 4. Testing SalaryStructure Validation & Creation ---');

    // Reject non-existent rule ID
    const fakeRuleId = 'non_existent_rule_999999';
    await expectError(
      salaryStructureService.createSalaryStructure({
        name: 'Invalid Structure',
        ruleIds: [basicRule.id, fakeRuleId],
      }),
      400,
      /Referenced salary rule ID\(s\) do not exist/i
    );
    console.log('  ✅ Rejected structure referencing non-existent rule ID correctly');

    // Create valid SalaryStructure with deliberate order: [HRA, BASIC, GROSS]
    // Testing that the specified array order is strictly preserved
    const desiredOrder = [hraRule.id, basicRule.id, grossRule.id];
    const structure = await salaryStructureService.createSalaryStructure({
      name: `Standard Tech Structure ${uniqueSuffix}`,
      description: 'Standard software engineering salary structure',
      ruleIds: desiredOrder,
    });
    createdStructureId = structure.id;

    assert.ok(structure.id, 'Structure ID should be generated');
    assert.deepStrictEqual(structure.ruleIds, desiredOrder, 'Should preserve exact ruleIds array order');
    console.log(`  ✅ Created SalaryStructure with preserved ruleIds order: ${structure.name}`);

    // Retrieve with populateRules
    const populated = await salaryStructureService.getSalaryStructureById(structure.id, { populateRules: true });
    assert.strictEqual(populated.rules.length, 3);
    assert.strictEqual(populated.rules[0].id, hraRule.id, 'First populated rule must match first ruleId');
    assert.strictEqual(populated.rules[1].id, basicRule.id, 'Second populated rule must match second ruleId');
    assert.strictEqual(populated.rules[2].id, grossRule.id, 'Third populated rule must match third ruleId');
    console.log('  ✅ Populated rules preserved the exact structure rule order');

    // Update SalaryStructure
    const newOrder = [basicRule.id, hraRule.id, grossRule.id];
    const updatedStructure = await salaryStructureService.updateSalaryStructure(structure.id, {
      ruleIds: newOrder,
    });
    assert.deepStrictEqual(updatedStructure.ruleIds, newOrder);
    console.log('  ✅ Updated structure with new order successfully');

    /* ------------------------------------------------------------------------ */
    /* 5. CLEANUP / DELETION TESTS                                              */
    /* ------------------------------------------------------------------------ */
    console.log('\n--- 5. Testing Deletion & Cleanup ---');

    const structDeleted = await salaryStructureService.deleteSalaryStructure(createdStructureId);
    assert.strictEqual(structDeleted, true);
    console.log('  ✅ Deleted test SalaryStructure');

    for (const ruleId of createdRuleIds) {
      const deleted = await salaryRuleService.deleteSalaryRule(ruleId);
      assert.strictEqual(deleted, true);
    }
    console.log('  ✅ Deleted all created test SalaryRules');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    // Cleanup if possible
    if (createdStructureId) {
      await salaryStructureService.deleteSalaryStructure(createdStructureId).catch(() => {});
    }
    for (const ruleId of createdRuleIds) {
      await salaryRuleService.deleteSalaryRule(ruleId).catch(() => {});
    }
    process.exit(1);
  }
}

runTests();
