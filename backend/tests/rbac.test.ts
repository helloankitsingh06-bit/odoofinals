import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { Role } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

function makeToken(role: Role, id: string = 'test-user', employeeId: string | null = null): string {
  return jwt.sign({ id, name: `Test ${role}`, email: `${role.toLowerCase()}@test.com`, role, employeeId }, JWT_SECRET);
}

describe('RBAC Matrix Route Tests', () => {
  const employeeToken = makeToken(Role.Employee, 'u1', 'emp1');
  const hrManagerToken = makeToken(Role.HRManager, 'u2');
  const hrPayrollUserToken = makeToken(Role.HRPayrollUser, 'u3');
  const hrPayrollManagerToken = makeToken(Role.HRPayrollManager, 'u4');
  const adminToken = makeToken(Role.Admin, 'u5');

  describe('Salary Structure Creation (Must be HRPayrollManager or Admin only)', () => {
    it('rejects Employee with 403', async () => {
      const res = await request(app)
        .post('/api/salary-structures/structures')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test Structure' });
      expect(res.status).toBe(403);
    });

    it('rejects HRManager with 403', async () => {
      const res = await request(app)
        .post('/api/salary-structures/structures')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ name: 'Test Structure' });
      expect(res.status).toBe(403);
    });

    it('rejects HRPayrollUser with 403 (Read-only on structures)', async () => {
      const res = await request(app)
        .post('/api/salary-structures/structures')
        .set('Authorization', `Bearer ${hrPayrollUserToken}`)
        .send({ name: 'Test Structure' });
      expect(res.status).toBe(403);
    });

    it('allows HRPayrollManager (fails at validation not 403)', async () => {
      const res = await request(app)
        .post('/api/salary-structures/structures')
        .set('Authorization', `Bearer ${hrPayrollManagerToken}`)
        .send({});
      // 400 Bad Request indicates middleware allowed it through to controller validation
      expect(res.status).toBe(400);
    });
  });

  describe('Mark Payrun as Paid (Strictly HRPayrollManager and Admin)', () => {
    it('rejects Employee with 403', async () => {
      const res = await request(app)
        .post('/api/payruns/dummy-id/mark-paid')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects HRManager with 403', async () => {
      const res = await request(app)
        .post('/api/payruns/dummy-id/mark-paid')
        .set('Authorization', `Bearer ${hrManagerToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects HRPayrollUser with 403', async () => {
      const res = await request(app)
        .post('/api/payruns/dummy-id/mark-paid')
        .set('Authorization', `Bearer ${hrPayrollUserToken}`);
      expect(res.status).toBe(403);
    });

    it('allows HRPayrollManager to reach handler (404 for dummy-id, not 403)', async () => {
      const res = await request(app)
        .post('/api/payruns/dummy-id/mark-paid')
        .set('Authorization', `Bearer ${hrPayrollManagerToken}`);
      expect(res.status).toBe(404);
    });

    it('allows Admin to reach handler (404 for dummy-id, not 403)', async () => {
      const res = await request(app)
        .post('/api/payruns/dummy-id/mark-paid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Time Off Approvals (HRManager, HRPayrollUser, HRPayrollManager, Admin)', () => {
    it('rejects standard Employee from approving time off with 403', async () => {
      const res = await request(app)
        .post('/api/time-off/requests/req-123/approve')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('allows HRManager to reach handler (404/error for missing req, not 403)', async () => {
      const res = await request(app)
        .post('/api/time-off/requests/req-123/approve')
        .set('Authorization', `Bearer ${hrManagerToken}`);
      expect(res.status).toBe(400); // Throws Error: Time off request not found
    });
  });
});
