const express = require('express');
const workingScheduleController = require('../controllers/workingScheduleController');
const {
  verifyToken,
  requireHRPayrollUser,
} = require('../src/middleware/auth');

const router = express.Router();

// All schedule routes require an authenticated user
router.use(verifyToken);

// Schedule reading
router.get('/', workingScheduleController.listSchedules);
router.get('/:id', workingScheduleController.getSchedule);

// Schedule mutations restricted to HRPayrollUser (or HRPayrollManager / Admin)
router.post('/', requireHRPayrollUser, workingScheduleController.createSchedule);
router.put('/:id', requireHRPayrollUser, workingScheduleController.updateSchedule);
router.patch('/:id', requireHRPayrollUser, workingScheduleController.updateSchedule);
router.delete('/:id', requireHRPayrollUser, workingScheduleController.deleteSchedule);

module.exports = router;
