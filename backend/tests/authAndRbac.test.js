const { test, describe } = require('node:test');
const assert = require('node:assert');
const { ROLES, VALID_ROLES } = require('../src/constants');
const { requireRole, requireAdmin } = require('../src/middleware/auth');

describe('Deliverable 1: Auth & RBAC Middleware Verification', () => {
  test('Role constants conform to shared schema contract', () => {
    assert.deepStrictEqual(VALID_ROLES, [
      'Employee',
      'HRManager',
      'HRPayrollUser',
      'HRPayrollManager',
      'Admin',
    ]);
  });

  test('requireAdmin rejects non-Admin roles with 403', () => {
    const nonAdminRoles = ['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager'];
    for (const role of nonAdminRoles) {
      const req = { user: { uid: 'u1', role } };
      let statusCalled = null;
      let jsonCalled = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (payload) => {
              jsonCalled = payload;
            },
          };
        },
      };
      const next = () => {
        nextCalled = true;
      };

      requireAdmin(req, res, next);
      assert.strictEqual(statusCalled, 403, `Role ${role} should receive 403`);
      assert.strictEqual(nextCalled, false, `Role ${role} should not call next()`);
      assert.strictEqual(jsonCalled.error, 'Forbidden');
    }
  });

  test('requireAdmin allows Admin role', () => {
    const req = { user: { uid: 'u_admin', role: ROLES.ADMIN } };
    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => {},
    };
    const next = () => {
      nextCalled = true;
    };

    requireAdmin(req, res, next);
    assert.strictEqual(nextCalled, true, 'Admin should call next()');
  });

  test('requireRole hierarchy checks', () => {
    const requireHR = requireRole([ROLES.ADMIN, ROLES.HR_MANAGER], 'HRManager or Admin');

    // HRManager should pass
    let passed = false;
    requireHR({ user: { role: ROLES.HR_MANAGER } }, {}, () => { passed = true; });
    assert.strictEqual(passed, true);

    // Employee should fail (403)
    let failedStatus = null;
    requireHR(
      { user: { role: ROLES.EMPLOYEE } },
      { status: (s) => ({ json: () => { failedStatus = s; } }) },
      () => {}
    );
    assert.strictEqual(failedStatus, 403);
  });
});
