const assert = require('assert');
const { db } = require('../firebase');
const timeOffTypeService = require('../services/timeOffTypeService');
const allocationService = require('../services/allocationService');
const timeOffRequestService = require('../services/timeOffRequestService');

async function runFullFlowTest() {
  console.log('=== STARTING P2 CORE DIFFERENTIATOR FLOW TEST ===\n');

  const testId = Date.now();
  const testEmployeeId = `emp_test_${testId}`;
  let typeId = null;
  let allocId = null;
  let requestId = null;
  let overRequestId = null;
  let refuseRequestId = null;

  try {
    // 1. Create a Time Off Type (requiresAllocation = true)
    console.log('1. Creating Time Off Type (requiresAllocation = true)...');
    const type = await timeOffTypeService.createTimeOffType({
      name: `Paid Vacation ${testId}`,
      unit: 'Days',
      requiresAllocation: true,
      requiresApproval: true,
      payrollIntegrated: true,
    });
    typeId = type.id;
    assert.strictEqual(type.requiresAllocation, true);
    assert.strictEqual(type.unit, 'Days');
    console.log(`   ✓ Created Time Off Type ID: ${typeId}`);

    // 2. Create an Allocation for test employee
    console.log('2. Creating Allocation of 10 days for employee...');
    const alloc = await allocationService.createAllocation({
      employeeId: testEmployeeId,
      timeOffTypeId: typeId,
      allocatedAmount: 10,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      status: 'Pending',
    });
    allocId = alloc.id;
    assert.strictEqual(alloc.status, 'Pending');
    assert.strictEqual(alloc.allocatedAmount, 10);
    assert.strictEqual(alloc.remainingAmount, 10);
    assert.strictEqual(alloc.takenAmount, 0);
    console.log(`   ✓ Created Allocation ID: ${allocId} (Status: Pending)`);

    // 3. Approve the Allocation as HRManager
    console.log('3. Approving the Allocation as HRManager...');
    const approvedAlloc = await allocationService.approveAllocation(
      allocId,
      'HRManager'
    );
    assert.strictEqual(approvedAlloc.status, 'Approved');
    console.log('   ✓ Allocation approved successfully');

    // 4. Verify Available Balance helper
    console.log('4. Checking getAvailableBalance helper...');
    const balance = await allocationService.getAvailableBalance(
      testEmployeeId,
      typeId,
      '2026-06-01'
    );
    assert.strictEqual(balance.totalAvailable, 10);
    console.log(`   ✓ Balance verified: ${balance.totalAvailable} Days available`);

    // 5. Submit a Time Off Request for 3 days
    console.log('5. Submitting Time Off Request for 3 days...');
    const request = await timeOffRequestService.createTimeOffRequest({
      employeeId: testEmployeeId,
      timeOffTypeId: typeId,
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      duration: 3,
      reason: 'Summer holiday',
    });
    requestId = request.id;
    assert.strictEqual(request.status, 'Pending');
    assert.strictEqual(request.duration, 3);
    console.log(`   ✓ Time Off Request ID: ${requestId} (Status: Pending)`);

    // 6. Approve the Request inside Firestore Transaction
    console.log(
      '6. Approving Request via atomic transaction & deducting balance...'
    );
    const approveResult = await timeOffRequestService.approveTimeOffRequest(
      requestId,
      'HRManager'
    );
    assert.strictEqual(approveResult.request.status, 'Approved');
    assert.strictEqual(approveResult.allocation.takenAmount, 3);
    assert.strictEqual(approveResult.allocation.remainingAmount, 7);
    console.log(
      '   ✓ Approval transaction completed: takenAmount = 3, remainingAmount = 7'
    );

    // 7. Re-fetch the Allocation directly from Firestore to guarantee persistence
    console.log('7. Re-fetching Allocation from Firestore to verify persistence...');
    const refetchedAlloc = await allocationService.getAllocationById(allocId);
    assert.strictEqual(refetchedAlloc.takenAmount, 3);
    assert.strictEqual(refetchedAlloc.remainingAmount, 7);
    assert.strictEqual(refetchedAlloc.allocatedAmount, 10);
    console.log(
      `   ✓ Verified directly from Firestore: allocated = ${refetchedAlloc.allocatedAmount}, taken = ${refetchedAlloc.takenAmount}, remaining = ${refetchedAlloc.remainingAmount}`
    );

    // 8. Test Over-Allocation Rejection (duration = 8 days when remaining = 7)
    console.log('8. Testing Over-Allocation Rejection (request 8 days with only 7 remaining)...');
    let overAllocFailedAtCreation = false;
    try {
      const overReq = await timeOffRequestService.createTimeOffRequest({
        employeeId: testEmployeeId,
        timeOffTypeId: typeId,
        startDate: '2026-07-01',
        endDate: '2026-07-08',
        duration: 8,
        reason: 'Long trip',
      });
      overRequestId = overReq.id;
      // If creation didn't throw, approval MUST throw inside transaction:
      await timeOffRequestService.approveTimeOffRequest(overRequestId, 'HRManager');
    } catch (err) {
      overAllocFailedAtCreation = true;
      console.log(`   ✓ Over-allocation correctly rejected: "${err.message}"`);
    }
    assert.strictEqual(
      overAllocFailedAtCreation,
      true,
      'Expected over-allocation to be rejected!'
    );

    // 9. Test Refuse Request workflow
    console.log('9. Testing Refusal workflow...');
    const refuseReq = await timeOffRequestService.createTimeOffRequest({
      employeeId: testEmployeeId,
      timeOffTypeId: typeId,
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      duration: 2,
      reason: 'Trip',
    });
    refuseRequestId = refuseReq.id;
    const refused = await timeOffRequestService.refuseTimeOffRequest(
      refuseRequestId,
      'HRManager',
      'Team capacity constraints'
    );
    assert.strictEqual(refused.status, 'Refused');
    assert.strictEqual(refused.refusalReason, 'Team capacity constraints');

    // Confirm allocation balance did not change on refusal
    const finalAlloc = await allocationService.getAllocationById(allocId);
    assert.strictEqual(finalAlloc.takenAmount, 3);
    assert.strictEqual(finalAlloc.remainingAmount, 7);
    console.log('   ✓ Refused request did not alter allocation balance (still 7 remaining)');

    console.log(
      '\n🎉 ALL TESTS PASSED! CORE DIFFERENTIATOR TRANSACTION IS BULLETPROOF!'
    );
  } finally {
    // Clean up test documents
    console.log('\nCleaning up test documents from Firestore...');
    if (requestId) await db.collection('timeOffRequests').doc(requestId).delete();
    if (overRequestId) await db.collection('timeOffRequests').doc(overRequestId).delete();
    if (refuseRequestId) await db.collection('timeOffRequests').doc(refuseRequestId).delete();
    if (allocId) await db.collection('allocations').doc(allocId).delete();
    if (typeId) await db.collection('timeOffTypes').doc(typeId).delete();
    console.log('✓ Cleanup completed.');
  }
}

runFullFlowTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
