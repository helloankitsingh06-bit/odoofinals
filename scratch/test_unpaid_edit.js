const assert = require('assert');

// Test employee leaves before and after editing unpaid leave
const types = [
  { id: 't1', name: 'Paid Annual Leave', requiresAllocation: true, unit: 'Days' },
  { id: 't2', name: 'Sick Leave', requiresAllocation: true, unit: 'Days' },
  { id: 't3', name: 'Other', requiresAllocation: true, unit: 'Days' },
  { id: 't4', name: 'Unpaid Leave', requiresAllocation: false, unit: 'Days' }
];

const allocations = [
  { id: 'a1', employeeId: 'emp-devon', timeOffTypeId: 't1', allocatedAmount: 20, takenAmount: 2, remainingAmount: 18 },
  { id: 'a2', employeeId: 'emp-devon', timeOffTypeId: 't2', allocatedAmount: 10, takenAmount: 1, remainingAmount: 9 },
  { id: 'a3', employeeId: 'emp-devon', timeOffTypeId: 't3', allocatedAmount: 5, takenAmount: 2, remainingAmount: 3 },
];

let requests = [
  { id: 'r1', employeeId: 'emp-devon', timeOffTypeId: 't4', timeOffType: types[3], duration: 2, status: 'Approved' },
];

function computeCardMetrics(empId) {
  const empAllocs = allocations.filter(a => a.employeeId === empId);
  let totalRemaining = 0;
  let totalAllocated = 0;
  let totalTaken = 0;
  empAllocs.forEach(a => {
    totalRemaining += a.remainingAmount || 0;
    totalAllocated += a.allocatedAmount || 0;
    totalTaken += a.takenAmount || 0;
  });

  const empUnpaid = requests.filter(
    r => r.employeeId === empId && (!r.timeOffType?.requiresAllocation || r.timeOffType?.name?.toLowerCase().includes('unpaid'))
  );
  const empApprovedUnpaid = empUnpaid.filter(r => r.status === 'Approved');
  const unpaidDaysTaken = empApprovedUnpaid.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

  return { totalRemaining, totalAllocated, totalTaken, unpaidDaysTaken, ratio: `${unpaidDaysTaken} Taken / No Limit` };
}

// Initial state: 2 unpaid days taken
const before = computeCardMetrics('emp-devon');
assert.strictEqual(before.totalRemaining, 30);
assert.strictEqual(before.unpaidDaysTaken, 2);
assert.strictEqual(before.ratio, '2 Taken / No Limit');

// Simulate HR editing unpaid leave duration from 2 days to 5 days
requests[0].duration = 5;
requests[0].reason = 'Extended family travel';

// After state: 5 unpaid days taken, paid quota untouched
const after = computeCardMetrics('emp-devon');
assert.strictEqual(after.totalRemaining, 30, 'Paid quota must stay untouched at 30 days');
assert.strictEqual(after.unpaidDaysTaken, 5, 'Unpaid days taken should now be 5');
assert.strictEqual(after.ratio, '5 Taken / No Limit', 'Ratio must update to 5 Taken / No Limit');

console.log('Unpaid leave edit verification passed successfully!');
console.log({ before, after });
