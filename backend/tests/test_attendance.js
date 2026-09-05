const assert = require('assert');
const {
  calculateWorkedHours,
  evaluateStatus,
  findScheduledDayPattern,
  calculateDailyScheduledHours,
  VALID_STATUSES,
} = require('../services/attendanceService');

console.log('--- Testing Attendance Service Logic ---');

// 1. Test Status Enums
assert.deepStrictEqual(VALID_STATUSES, [
  'Present',
  'Late',
  'Absent',
  'Overtime',
  'MissingCheckout',
]);
console.log('✓ Valid statuses enum match shared schema exact');

// 2. Test Scheduled Day Pattern Match
const pattern = [
  { day: 'Monday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
  { day: 'Tuesday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
];
const mondayDate = new Date('2026-09-07T09:00:00Z'); // 2026-09-07 is Monday
const matched = findScheduledDayPattern(pattern, mondayDate);
assert(matched !== null);
assert.strictEqual(matched.day, 'Monday');
console.log('✓ Weekly pattern day matching works');

// 3. Test Daily Scheduled Hours
const schedHours = calculateDailyScheduledHours(pattern[0]);
// 09:00 to 17:00 = 8h, minus 60 mins break = 7h
assert.strictEqual(schedHours, 7);
console.log('✓ Scheduled daily hours computed correctly (7 hours)');

// 4. Test Worked Hours
const checkInTime = new Date('2026-09-07T09:00:00Z');
const checkOutTime = new Date('2026-09-07T17:30:00Z'); // 8.5 hours gross
const workedHours = calculateWorkedHours(checkInTime, checkOutTime, 60); // minus 1 hr break = 7.5 hours
assert.strictEqual(workedHours, 7.5);
console.log('✓ Worked hours computation with break works (7.5 hours)');

// 5. Test Status: Present on time
const statusOnTime = evaluateStatus({
  checkInDate: new Date('2026-09-07T09:10:00'), // within 15 min grace of 09:00
  checkOutDate: new Date('2026-09-07T17:00:00'),
  pattern: { startTime: '09:00', endTime: '17:00', breakMins: 60 },
  workedHours: 7,
});
assert.strictEqual(statusOnTime, 'Present');
console.log('✓ On-time check-in evaluates to "Present"');

// 6. Test Status: Late (> 15 min grace)
const statusLate = evaluateStatus({
  checkInDate: new Date('2026-09-07T09:25:00'), // 25 mins late (> 15 min grace)
  checkOutDate: new Date('2026-09-07T17:00:00'),
  pattern: { startTime: '09:00', endTime: '17:00', breakMins: 60 },
  workedHours: 6.75,
});
assert.strictEqual(statusLate, 'Late');
console.log('✓ Late check-in (> 15 mins) evaluates to "Late"');

// 7. Test Status: Overtime
const statusOT = evaluateStatus({
  checkInDate: new Date('2026-09-07T09:00:00'),
  checkOutDate: new Date('2026-09-07T19:00:00'),
  pattern: { startTime: '09:00', endTime: '17:00', breakMins: 60 },
  workedHours: 9, // 9 hours worked vs 7 scheduled (> 7 + 0.5)
});
assert.strictEqual(statusOT, 'Overtime');
console.log('✓ Overtime (> scheduled + 0.5h) evaluates to "Overtime"');

// 8. Test Status: MissingCheckout
const statusMissing = evaluateStatus({
  checkInDate: new Date('2026-09-01T09:00:00'), // Past date
  checkOutDate: null,
  pattern: { startTime: '09:00', endTime: '17:00', breakMins: 60 },
  workedHours: null,
});
assert.strictEqual(statusMissing, 'MissingCheckout');
console.log('✓ Past open check-in evaluates to "MissingCheckout"');

// 9. Test Status: Absent
const statusAbsent = evaluateStatus({
  checkInDate: null,
  checkOutDate: null,
});
assert.strictEqual(statusAbsent, 'Absent');
console.log('✓ Missing check-in evaluates to "Absent"');

console.log('\nAll attendance service logic tests passed successfully!');
