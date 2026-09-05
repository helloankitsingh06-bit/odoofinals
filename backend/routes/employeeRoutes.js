const express = require('express');
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireHRManager } = require('../src/middleware/auth');

const router = express.Router();

// All employee routes require an authenticated user
router.use(verifyToken);

// Employee list and details
router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);

// Mutation endpoints restricted to HRManager (or Admin)
router.post('/', requireHRManager, employeeController.createEmployee);
router.put('/:id', requireHRManager, employeeController.updateEmployee);
router.patch('/:id', requireHRManager, employeeController.updateEmployee);
router.delete('/:id', requireHRManager, employeeController.deleteEmployee);

module.exports = router;
