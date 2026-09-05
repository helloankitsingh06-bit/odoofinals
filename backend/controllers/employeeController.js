const employeeService = require('../services/employeeService');

/**
 * Employee Controller: Thin HTTP layer forwarding to employeeService
 */

async function listEmployees(req, res, next) {
  try {
    const employees = await employeeService.getEmployees(req.query);
    res.json(employees);
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Employee with id "${req.params.id}" not found`,
      });
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Employee with id "${req.params.id}" not found`,
      });
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const deleted = await employeeService.deleteEmployee(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Employee with id "${req.params.id}" not found`,
      });
    }
    res.json({ message: 'Employee status set to Inactive' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
};
