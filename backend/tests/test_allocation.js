const assert = require('assert');
const {
  VALID_STATUSES,
  validateAllocationInput,
} = require('../services/allocationService');

console.log('--- Testing Allocation Service Validation ---');

// 1. Test Valid Statuses Enum
assert.deepStrictEqual(VALID_STATUSES, ['Pending', 'Approved']);
console.log('✓ Valid statuses enum strictly ["Pending", "Approved"]');

// 2. Test Successful Validation
assert.doesNotThrow(() => {
  validateAllocationInput({
    employeeId: 'emp_001',
    timeOffTypeId: 'tot_001',
    allocatedAmount: 15,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'Pending',
  });
});
console.log('✓ Valid allocation passes validation');

// 3. Test Negative / Zero Allocation rejection
assert.throws(
  () => {
    validateAllocationInput({
      employeeId: 'emp_001',
      timeOffTypeId: 'tot_001',
      allocatedAmount: 0,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    });
  },
  /must be a positive number/
);
console.log('✓ Zero/negative allocatedAmount rejected');

// 4. Test Invalid Date Range (validTo < validFrom)
assert.throws(
  () => {
    validateAllocationInput({
      employeeId: 'emp_001',
      timeOffTypeId: 'tot_001',
      allocatedAmount: 10,
      validFrom: '2026-12-31',
      validTo: '2026-01-01',
    });
  },
  /cannot be earlier than "validFrom"/
);
console.log('✓ Invalid date range rejected');

// 5. Test Invalid Status (e.g. "Refused" which does not exist for allocations)
assert.throws(
  () => {
    validateAllocationInput({
      employeeId: 'emp_001',
      timeOffTypeId: 'tot_001',
      allocatedAmount: 10,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      status: 'Refused', // Invalid for allocations!
    });
  },
  /must be one of: Pending, Approved/
);
console.log('✓ Status "Refused" correctly forbidden on allocations');

console.log('\nAll Allocation service tests passed successfully!');
