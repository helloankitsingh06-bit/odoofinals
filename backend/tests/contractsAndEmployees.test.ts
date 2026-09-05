import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { Role } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

function makeToken(role: Role, id: string = 'test-hr-user'): string {
  return jwt.sign({ id, name: `Test HR`, email: 'hrmanager@peoplepay360.com', role, employeeId: null }, JWT_SECRET);
}

describe('Contract & Employee Validation Enhancements', () => {
  const hrToken = makeToken(Role.HRManager);

  describe('Contract Validation Edge Cases', () => {
    it('rejects invalid start date format with 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: 'dummy-emp',
          startDate: 'invalid-date-string',
          wage: 5000,
          salaryStructureId: 'dummy-struct',
          department: 'Engineering',
          jobPosition: 'Developer'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid contract start date format');
    });

    it('rejects non-positive wage with 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: 'dummy-emp',
          startDate: '2026-01-01',
          wage: -100,
          salaryStructureId: 'dummy-struct',
          department: 'Engineering',
          jobPosition: 'Developer'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Contract wage must be a positive number');
    });

    it('rejects non-existent employee with 404', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: 'non-existent-uuid',
          startDate: '2026-01-01',
          wage: 5000,
          salaryStructureId: 'dummy-struct',
          department: 'Engineering',
          jobPosition: 'Developer'
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Employee not found');
    });
  });

  describe('Employee Input Sanitization', () => {
    it('rejects whitespace-only employee name with 400', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: '   ',
          department: 'Engineering',
          jobPosition: 'Developer'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be empty');
    });

    it('rejects invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'John Doe',
          email: 'not-an-email',
          department: 'Engineering',
          jobPosition: 'Developer'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid email address format');
    });
  });
});
