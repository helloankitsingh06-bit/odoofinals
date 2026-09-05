const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const {
  verifyToken,
  requireHRManagerPlus,
} = require('../src/middleware/auth');

const router = express.Router();

// All attendance routes require authentication
router.use(verifyToken);

// Employee check-in & check-out
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// List records (Employees see own records, HRManager+ can see all)
router.get('/', attendanceController.listAttendance);
router.get('/:id', attendanceController.getAttendanceById);

// Manual correction: Strictly restricted to HRManager+ (HRManager, HRPayrollManager, Admin)
router.patch(
  '/:id/manual-correct',
  requireHRManagerPlus,
  attendanceController.manualCorrection
);

// Explicit absent entry: Restricted to HRManager+
router.post('/absent', requireHRManagerPlus, attendanceController.recordAbsent);

module.exports = router;
