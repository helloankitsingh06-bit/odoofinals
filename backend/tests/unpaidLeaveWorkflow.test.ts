import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { Role } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

function makeToken(role: Role, id: string = 'test-hr-user', employeeId: string | null = null): string {
  return jwt.sign(
    { id, name: 'Test HR', email: 'hrmanager@peoplepay360.com', role, employeeId },
    JWT_SECRET
  );
}

describe('Unpaid Leave Workflow (Zero Allocation & Approval Verification)', () => {
  const hrToken = makeToken(Role.HRManager);
  let testEmployee: any;
  let unpaidType: any;
  let createdRequestId: string;

  beforeAll(async () => {
    // 1. Get or create test employee
    testEmployee = await prisma.employee.findFirst({
      where: { name: 'Sophia Chen' }
    });
    if (!testEmployee) {
      testEmployee = await prisma.employee.create({
        data: {
          name: 'Sophia Chen',
          email: 'sophia.chen@peoplepay360.com',
          department: 'Finance & Payroll',
          jobPosition: 'Payroll Director'
        }
      });
    }

    // 2. Ensure Unpaid Leave type exists with requiresAllocation: false
    unpaidType = await prisma.timeOffType.upsert({
      where: { name: 'Unpaid Leave' },
      update: { requiresAllocation: false, unit: 'Days' },
      create: {
        name: 'Unpaid Leave',
        unit: 'Days',
        requiresAllocation: false,
        requiresApproval: true,
        payrollIntegrated: true
      }
    });

    // Verify employee has NO allocation for Unpaid Leave
    const alloc = await prisma.allocation.findFirst({
      where: {
        employeeId: testEmployee.id,
        timeOffTypeId: unpaidType.id
      }
    });
    expect(alloc).toBeNull();
  });

  it('Step 1: Successfully submits an Unpaid Leave request without requiring any allocation quota', async () => {
    const res = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: testEmployee.id,
        timeOffTypeId: unpaidType.id,
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        duration: 3,
        reason: 'Personal unpaid leave request'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('Pending');
    expect(res.body.duration).toBe(3);
    createdRequestId = res.body.id;
  });

  it('Step 2: HR/Admin successfully approves the Unpaid Leave request without needing an allocation', async () => {
    const res = await request(app)
      .post(`/api/time-off/requests/${createdRequestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('approved');
    expect(res.body.request.status).toBe('Approved');

    // Confirm in DB
    const dbReq = await prisma.timeOffRequest.findUnique({
      where: { id: createdRequestId }
    });
    expect(dbReq?.status).toBe('Approved');
  });

  it('Step 3: Confirms employee still has 0 allocations for Unpaid Leave and no paid allocation was deducted', async () => {
    const unpaidAlloc = await prisma.allocation.findFirst({
      where: {
        employeeId: testEmployee.id,
        timeOffTypeId: unpaidType.id
      }
    });
    expect(unpaidAlloc).toBeNull();
  });

  it('Step 4: HR/Admin can edit the Unpaid Leave request details (duration, dates, reason)', async () => {
    const res = await request(app)
      .patch(`/api/time-off/requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        duration: 5,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
        reason: 'Updated unpaid leave duration to 5 days'
      });

    expect(res.status).toBe(200);
    expect(res.body.request.duration).toBe(5);
    expect(res.body.request.reason).toBe('Updated unpaid leave duration to 5 days');

    const dbReq = await prisma.timeOffRequest.findUnique({
      where: { id: createdRequestId }
    });
    expect(dbReq?.duration).toBe(5);
    expect(dbReq?.endDate).toEqual(new Date('2026-10-05'));
  });
});
