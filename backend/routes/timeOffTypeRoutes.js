const express = require('express');
const timeOffTypeController = require('../controllers/timeOffTypeController');
const {
  verifyToken,
  requireHRManagerPlus,
} = require('../src/middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Read is accessible to any authenticated user
router.get('/', timeOffTypeController.getTimeOffTypes);
router.get('/:id', timeOffTypeController.getTimeOffTypeById);

// Create, Update, Delete restricted to HRManager+
router.post('/', requireHRManagerPlus, timeOffTypeController.createTimeOffType);
router.patch(
  '/:id',
  requireHRManagerPlus,
  timeOffTypeController.updateTimeOffType
);
router.delete(
  '/:id',
  requireHRManagerPlus,
  timeOffTypeController.deleteTimeOffType
);

module.exports = router;
