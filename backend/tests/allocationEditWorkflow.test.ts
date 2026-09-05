import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { Role } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

function makeToken(role: Role, id: string = 'test-hr-user', employeeId: string | null = null): string {
  return jwt.sign(
    { id, name: `Test HR`, email: 'hrmanager@peoplepay360.com', role, employeeId },
    JWT_SECRET
  );
}

describe('Leave Allocation Edit & Deduplication Workflow (6-Step Verification)', () => {
  const hrToken = makeToken(Role.HRManager);
  let testEmployee: any;
  let testLeaveType: any;
  let createdAllocationId: string;

  beforeAll(async () => {
    // 1. Find or create a distinct test employee
    testEmployee = await prisma.employee.findFirst({
      where: { name: 'Devon Hayes' }
    });
    if (!testEmployee) {
      testEmployee = await prisma.employee.create({
        data: {
          name: 'Devon Hayes',
          email: 'devon.hayes@peoplepay360.com',
          department: 'Engineering',
          jobPosition: 'Senior Software Engineer'
        }
      });
    }

    // 2. Create a fresh distinct leave type for clean test isolation
    testLeaveType = await prisma.timeOffType.create({
      data: {
        name: `Executive Sabbatical ${Date.now()}`,
        unit: 'Days',
        requiresAllocation: true,
        requiresApproval: true,
        payrollIntegrated: true
      }
    });
  });

  // STEP 1: Grant a new allocation (20 days)
  it('Step 1: Grants a new allocation (20 days) for test employee and confirms creation', async () => {
    const res = await request(app)
      .post('/api/time-off/allocations')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: testEmployee.id,
        timeOffTypeId: testLeaveType.id,
        allocatedAmount: 20,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'Approved'
      });

    expect(res.status).toBe(201);
    expect(res.body.allocatedAmount).toBe(20);
    expect(res.body.takenAmount).toBe(0);
    expect(res.body.remainingAmount).toBe(20);
    createdAllocationId = res.body.id;

    // Verify in DB directly
    const dbRecord = await prisma.allocation.findUnique({
      where: { id: createdAllocationId }
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.allocatedAmount).toBe(20);
    expect(dbRecord?.remainingAmount).toBe(20);
  });

  // STEP 2: Try creating a SECOND allocation for same employee + same type -> BLOCKED
  it('Step 2: Blocks duplicate allocation creation with exact required message', async () => {
    const res = await request(app)
      .post('/api/time-off/allocations')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: testEmployee.id,
        timeOffTypeId: testLeaveType.id,
        allocatedAmount: 15,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'Approved'
      });

    expect(res.status).toBe(400);
    const expectedMessage = `An allocation already exists for ${testEmployee.name} — ${testLeaveType.name} (20 days remaining). Use Edit on the existing allocation instead.`;
    expect(res.body.error).toBe(expectedMessage);

    // Confirm in DB no duplicate was created
    const count = await prisma.allocation.count({
      where: {
        employeeId: testEmployee.id,
        timeOffTypeId: testLeaveType.id
      }
    });
    expect(count).toBe(1);
  });

  // STEP 3: Edit existing allocation to increase it (20 -> 25 days)
  it('Step 3: Edits existing allocation to 25 days, updates remainingAmount to 25, and verifies no duplicate row', async () => {
    const res = await request(app)
      .patch(`/api/time-off/allocations/${createdAllocationId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        allocatedAmount: 25,
        validFrom: '2026-01-01',
        validTo: '2026-12-31'
      });

    expect(res.status).toBe(200);
    expect(res.body.allocation.allocatedAmount).toBe(25);
    expect(res.body.allocation.takenAmount).toBe(0);
    expect(res.body.allocation.remainingAmount).toBe(25);

    // Confirm DB row count is still exactly 1
    const count = await prisma.allocation.count({
      where: {
        employeeId: testEmployee.id,
        timeOffTypeId: testLeaveType.id
      }
    });
    expect(count).toBe(1);
  });

  // STEP 4: Approve a Time Off Request (5 days taken, 20 remaining)
  it('Step 4: Submits and approves a 5-day time off request (taken=5, remaining=20)', async () => {
    const empToken = makeToken(Role.Employee, 'emp-user', testEmployee.id);

    // Submit 5 days request
    const reqRes = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        employeeId: testEmployee.id,
        timeOffTypeId: testLeaveType.id,
        startDate: '2026-07-01',
        endDate: '2026-07-05',
        duration: 5,
        reason: 'Mid-year sabbatical break'
      });
    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.id;

    // Approve request as HR Manager
    const approveRes = await request(app)
      .post(`/api/time-off/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(approveRes.status).toBe(200);

    // Verify allocation in DB
    const updatedAlloc = await prisma.allocation.findUnique({
      where: { id: createdAllocationId }
    });
    expect(updatedAlloc?.allocatedAmount).toBe(25);
    expect(updatedAlloc?.takenAmount).toBe(5);
    expect(updatedAlloc?.remainingAmount).toBe(20);
  });

  // STEP 5: Try editing allocation down to LESS than taken amount (e.g. 3 when 5 taken) -> BLOCKED
  it('Step 5: Blocks reduction below taken amount with exact error message', async () => {
    const res = await request(app)
      .patch(`/api/time-off/allocations/${createdAllocationId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        allocatedAmount: 3
      });

    expect(res.status).toBe(400);
    const expectedError = `Cannot reduce allocation to 3 days — employee has already taken 5 days. Minimum allowed allocation is 5 days.`;
    expect(res.body.error).toBe(expectedError);

    // Verify allocation in DB was NOT changed
    const allocInDb = await prisma.allocation.findUnique({
      where: { id: createdAllocationId }
    });
    expect(allocInDb?.allocatedAmount).toBe(25);
    expect(allocInDb?.takenAmount).toBe(5);
    expect(allocInDb?.remainingAmount).toBe(20);
  });

  // STEP 6: Try editing allocation to valid amount (e.g. 25 days when 5 taken) -> SUCCEEDS
  it('Step 6: Edits allocation to valid amount (25 days when 5 taken) and confirms remainingAmount is 20', async () => {
    const res = await request(app)
      .patch(`/api/time-off/allocations/${createdAllocationId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        allocatedAmount: 25,
        validFrom: '2026-01-01',
        validTo: '2026-12-31'
      });

    expect(res.status).toBe(200);
    expect(res.body.allocation.allocatedAmount).toBe(25);
    expect(res.body.allocation.takenAmount).toBe(5);
    expect(res.body.allocation.remainingAmount).toBe(20);

    const allocInDb = await prisma.allocation.findUnique({
      where: { id: createdAllocationId }
    });
    expect(allocInDb?.allocatedAmount).toBe(25);
    expect(allocInDb?.takenAmount).toBe(5);
    expect(allocInDb?.remainingAmount).toBe(20);
  });
});
