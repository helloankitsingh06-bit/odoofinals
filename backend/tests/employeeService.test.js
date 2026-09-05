const { test, describe } = require('node:test');
const assert = require('node:assert');
const employeeService = require('../services/employeeService');
const { EMPLOYEE_STATUS } = require('../src/constants');

describe('Deliverable 2: Employee Service & Shared Schema Tests', () => {
  let createdEmployeeId = null;

  test('Rejects invalid status string (e.g. "onboarding" or lowercase "active")', async () => {
    await assert.rejects(
      async () => {
        await employeeService.createEmployee({
          name: 'Test Invalid Status',
          status: 'onboarding',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /Field "status" must be one of/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await employeeService.createEmployee({
          name: 'Test Lowercase Status',
          status: 'active',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('Rejects empty or missing name', async () => {
    await assert.rejects(
      async () => {
        await employeeService.createEmployee({
          name: '   ',
          department: 'Engineering',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('Creates employee matching exact locked schema', async () => {
    const created = await employeeService.createEmployee({
      name: 'Alice Johnson',
      department: 'Engineering',
      jobPosition: 'Senior Software Engineer',
      status: EMPLOYEE_STATUS.ACTIVE,
    });

    assert.ok(created.id, 'Should have an auto-generated Firestore ID');
    assert.strictEqual(created.name, 'Alice Johnson');
    assert.strictEqual(created.department, 'Engineering');
    assert.strictEqual(created.jobPosition, 'Senior Software Engineer');
    assert.strictEqual(created.status, 'Active');
    assert.ok(created.createdAt, 'Should have a createdAt timestamp');
    // Ensure email field does NOT exist on employee
    assert.strictEqual(created.email, undefined);

    createdEmployeeId = created.id;
  });

  test('Reads created employee by ID', async () => {
    assert.ok(createdEmployeeId, 'Need createdEmployeeId from previous test');
    const emp = await employeeService.getEmployeeById(createdEmployeeId);
    assert.ok(emp);
    assert.strictEqual(emp.id, createdEmployeeId);
    assert.strictEqual(emp.name, 'Alice Johnson');
  });

  test('Filters employees by department and status', async () => {
    const list = await employeeService.getEmployees({
      department: 'Engineering',
      status: 'Active',
    });
    assert.ok(Array.isArray(list));
    const found = list.find((e) => e.id === createdEmployeeId);
    assert.ok(found, 'Should find created employee in filtered list');
  });

  test('Updates employee details', async () => {
    assert.ok(createdEmployeeId);
    const updated = await employeeService.updateEmployee(createdEmployeeId, {
      jobPosition: 'Lead Architect',
    });
    assert.strictEqual(updated.jobPosition, 'Lead Architect');
  });

  test('Soft delete sets status to Inactive', async () => {
    assert.ok(createdEmployeeId);
    const deleted = await employeeService.deleteEmployee(createdEmployeeId);
    assert.strictEqual(deleted, true);

    const emp = await employeeService.getEmployeeById(createdEmployeeId);
    assert.strictEqual(emp.status, EMPLOYEE_STATUS.INACTIVE);
  });
});
