const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const contractService = require('../services/contractService');
const employeeService = require('../services/employeeService');
const { CONTRACT_STATUS } = require('../src/constants');

describe('Deliverable 3: Mandatory Contract Overlap Validation Tests', () => {
  let employeeId = null;
  let contractA = null;
  let contractC = null;
  let contractD = null;

  before(async () => {
    // Create a dedicated employee for contract overlap tests
    const emp = await employeeService.createEmployee({
      name: 'Contract Test Employee ' + Date.now(),
      department: 'Finance',
      jobPosition: 'Financial Analyst',
    });
    employeeId = emp.id;
  });

  // Test 1: Create contract A (Active, Jan 1–Jun 30) for employee X -> succeeds
  test('1. Create contract A (Active, Jan 1 to Jun 30) -> SUCCEEDS', async () => {
    contractA = await contractService.createContract({
      employeeId,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      wage: 5000,
      status: CONTRACT_STATUS.ACTIVE,
      department: 'Finance',
      jobPosition: 'Financial Analyst',
    });

    assert.ok(contractA.id);
    assert.strictEqual(contractA.status, 'Active');
    assert.strictEqual(contractA.startDate, '2026-01-01');
    assert.strictEqual(contractA.endDate, '2026-06-30');
  });

  // Test 2: Create contract B (Active, Apr 1–Sep 30) for employee X -> must fail (overlap)
  test('2. Create contract B (Active, Apr 1 to Sep 30) -> MUST FAIL (overlap with A)', async () => {
    await assert.rejects(
      async () => {
        await contractService.createContract({
          employeeId,
          startDate: '2026-04-01',
          endDate: '2026-09-30',
          wage: 5200,
          status: CONTRACT_STATUS.ACTIVE,
          department: 'Finance',
          jobPosition: 'Financial Analyst',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.conflictingContractId, contractA.id);
        return true;
      }
    );
  });

  // Test 3: Create contract C (Active, Jul 1–Dec 31) for employee X -> must succeed (starts after A ends)
  test('3. Create contract C (Active, Jul 1 to Dec 31) -> MUST SUCCEED (adjacent, no overlap)', async () => {
    contractC = await contractService.createContract({
      employeeId,
      startDate: '2026-07-01',
      endDate: '2026-12-31',
      wage: 5500,
      status: CONTRACT_STATUS.ACTIVE,
      department: 'Finance',
      jobPosition: 'Financial Analyst',
    });

    assert.ok(contractC.id);
    assert.strictEqual(contractC.status, 'Active');
  });

  // Test 4: Create contract D (Draft, Apr 1–Sep 30) for employee X -> must succeed (non-Active contracts never conflict)
  test('4. Create contract D (Draft, Apr 1 to Sep 30) -> MUST SUCCEED (Draft does not conflict)', async () => {
    contractD = await contractService.createContract({
      employeeId,
      startDate: '2026-04-01',
      endDate: '2026-09-30',
      wage: 5200,
      status: CONTRACT_STATUS.DRAFT,
      department: 'Finance',
      jobPosition: 'Financial Analyst',
    });

    assert.ok(contractD.id);
    assert.strictEqual(contractD.status, 'Draft');
  });

  // Test 5: Update contract D's status to Active -> must fail (now overlaps A)
  test("5. Update contract D's status to Active -> MUST FAIL (now overlaps A)", async () => {
    await assert.rejects(
      async () => {
        await contractService.updateContract(contractD.id, {
          status: CONTRACT_STATUS.ACTIVE,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.name, 'ValidationError');
        assert.ok(
          [contractA.id, contractC.id].includes(err.conflictingContractId),
          `Conflicting ID ${err.conflictingContractId} should be contractA (${contractA.id}) or contractC (${contractC.id})`
        );
        return true;
      }
    );
  });

  // Test 6: Create contract E (Active, open-ended, starts 2027-11-01) for employee X, then try to create contract F (Active, 2027-12-01 onward) -> must fail
  test('6. Create contract E (Active, open-ended, starts 2027-11-01) then F (Active, starts 2027-12-01) -> MUST FAIL', async () => {
    const contractE = await contractService.createContract({
      employeeId,
      startDate: '2027-11-01',
      endDate: null, // open-ended
      wage: 6000,
      status: CONTRACT_STATUS.ACTIVE,
      department: 'Finance',
      jobPosition: 'Financial Analyst',
    });

    assert.ok(contractE.id);
    assert.strictEqual(contractE.endDate, null);

    // Now attempt contract F overlapping with open-ended E
    await assert.rejects(
      async () => {
        await contractService.createContract({
          employeeId,
          startDate: '2027-12-01',
          endDate: '2028-06-30',
          wage: 6500,
          status: CONTRACT_STATUS.ACTIVE,
          department: 'Finance',
          jobPosition: 'Financial Analyst',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.conflictingContractId, contractE.id);
        return true;
      }
    );
  });

  // Test 7: Two near-simultaneous create requests for overlapping Active ranges -> only one should succeed
  test('7. Near-simultaneous create requests for overlapping Active ranges -> only one succeeds', async () => {
    const empRace = await employeeService.createEmployee({
      name: 'Race Test Employee ' + Date.now(),
      department: 'Operations',
      jobPosition: 'Operations Manager',
    });

    const promise1 = contractService.createContract({
      employeeId: empRace.id,
      startDate: '2028-01-01',
      endDate: '2028-12-31',
      wage: 7000,
      status: CONTRACT_STATUS.ACTIVE,
    });

    const promise2 = contractService.createContract({
      employeeId: empRace.id,
      startDate: '2028-06-01',
      endDate: '2028-12-31',
      wage: 7500,
      status: CONTRACT_STATUS.ACTIVE,
    });

    const results = await Promise.allSettled([promise1, promise2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one contract create must succeed');
    assert.strictEqual(rejected.length, 1, 'The other overlapping create must be rejected');
    assert.strictEqual(rejected[0].reason.statusCode, 400);
  });
});
