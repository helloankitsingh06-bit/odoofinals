const assert = require('assert');
const {
  VALID_UNITS,
  validateTimeOffTypeInput,
} = require('../services/timeOffTypeService');

console.log('--- Testing Time Off Type Service Validation ---');

// 1. Test Valid Units Enum
assert.deepStrictEqual(VALID_UNITS, ['Days', 'Hours']);
console.log('✓ Valid units enum is strictly ["Days", "Hours"]');

// 2. Test Successful Validation
assert.doesNotThrow(() => {
  validateTimeOffTypeInput({
    name: 'Paid Time Off',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegrated: true,
  });
});
console.log('✓ Valid Time Off Type input passes validation');

// 3. Test Invalid Unit rejection
assert.throws(
  () => {
    validateTimeOffTypeInput({
      name: 'Sick Leave',
      unit: 'days', // lowercase invalid
    });
  },
  /must be one of exactly: Days, Hours/
);

assert.throws(
  () => {
    validateTimeOffTypeInput({
      name: 'Sick Leave',
      unit: 'Minutes', // invalid unit
    });
  },
  /must be one of exactly: Days, Hours/
);
console.log('✓ Invalid units correctly rejected');

// 4. Test Empty Name rejection
assert.throws(
  () => {
    validateTimeOffTypeInput({
      name: '   ',
      unit: 'Days',
    });
  },
  /Field "name" is required and cannot be empty/
);
console.log('✓ Empty name correctly rejected');

console.log('\nAll Time Off Type service tests passed successfully!');
