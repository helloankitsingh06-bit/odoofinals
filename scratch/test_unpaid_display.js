const assert = require('assert');

// Test data replicating DB state
const types = [
  { id: 't1', name: 'Paid Annual Leave', requiresAllocation: true, unit: 'Days' },
  { id: 't2', name: 'Sick Leave', requiresAllocation: true, unit: 'Days' },
  { id: 't3', name: 'Other', requiresAllocation: true, unit: 'Days' },
  { id: 't4', name: 'Unpaid Leave', requiresAllocation: false, unit: 'Days' }
];

const allocations = [
  { id: 'a1', employeeId: 'emp-sophia', timeOffTypeId: 't1', allocatedAmount: 20, takenAmount: 0, remainingAmount: 20 },
  { id: 'a2', employeeId: 'emp-sophia', timeOffTypeId: 't2', allocatedAmount: 10, takenAmount: 0, remainingAmount: 10 },
  { id: 'a3', employeeId: 'emp-sophia', timeOffTypeId: 't3', allocatedAmount: 0, takenAmount: 0, remainingAmount: 0 },
];

const requests = [
  { id: 'r1', employeeId: 'emp-sophia', timeOffTypeId: 't4', timeOffType: types[3], duration: 3, status: 'Approved' },
  { id: 'r2', employeeId: 'emp-sophia', timeOffTypeId: 't4', timeOffType: types[3], duration: 3, status: 'Approved' },
  { id: 'r3', employeeId: 'emp-sophia', timeOffTypeId: 't4', timeOffType: types[3], duration: 2, status: 'Pending' },
];

// Logic in TimeOffPage
const emp = { id: 'emp-sophia', name: 'Sophia Chen' };
const empAllocations = allocations.filter((a) => a.employeeId === emp.id);

let totalRemaining = 0;
let totalAllocated = 0;
let totalTaken = 0;
empAllocations.forEach((a) => {
  totalRemaining += a.remainingAmount || 0;
  totalAllocated += a.allocatedAmount || 0;
  totalTaken += a.takenAmount || 0;
});

// Verification 1: Paid Quota totals MUST NOT include unpaid leaves
assert.strictEqual(totalAllocated, 30, 'Total allocated must be 30 (20 Annual + 10 Sick)');
assert.strictEqual(totalRemaining, 30, 'Total remaining must be 30');
assert.strictEqual(totalTaken, 0, 'Total paid taken must be 0 (Unpaid leave MUST NOT be calculated into this)');

// Verification 2: Unpaid leave calculations
const empUnpaidRequests = requests.filter(
  (r) =>
    r.employeeId === emp.id &&
    (!r.timeOffType?.requiresAllocation || r.timeOffType?.name?.toLowerCase().includes('unpaid'))
);
const empApprovedUnpaid = empUnpaidRequests.filter((r) => r.status === 'Approved');
const empPendingUnpaid = empUnpaidRequests.filter((r) => r.status === 'Pending');
const unpaidDaysTaken = empApprovedUnpaid.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);
const unpaidDaysPending = empPendingUnpaid.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

assert.strictEqual(unpaidDaysTaken, 6, 'Sophia Chen took 6 days of unpaid leave (3 + 3)');
assert.strictEqual(unpaidDaysPending, 2, 'Sophia Chen has 2 pending days of unpaid leave');

const ratioDisplay = `${unpaidDaysTaken} Taken / No Limit`;
assert.strictEqual(ratioDisplay, '6 Taken / No Limit', 'Ratio must display taken count over No Limit');

console.log('All assertions passed successfully!');
console.log({
  employee: emp.name,
  paidQuotaSummary: `${totalRemaining} Days Remaining (${totalTaken} Used • ${totalAllocated} Allocated)`,
  unpaidRatio: ratioDisplay,
  unpaidDetails: {
    taken: `${unpaidDaysTaken} Days`,
    pending: `${unpaidDaysPending} Days`,
    limit: 'None (Quota-Free)'
  }
});
