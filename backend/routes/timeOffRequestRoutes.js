const express = require('express');
const timeOffRequestController = require('../controllers/timeOffRequestController');
const {
  verifyToken,
  requireHRManagerPlus,
} = require('../src/middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Employee can submit and view requests
router.post('/', timeOffRequestController.createTimeOffRequest);
router.get('/', timeOffRequestController.listTimeOffRequests);
router.get('/:id', timeOffRequestController.getTimeOffRequestById);
router.delete('/:id', timeOffRequestController.deleteTimeOffRequest);

// Approve and Refuse strictly gated to HRManager+ (HRManager, HRPayrollManager, Admin)
router.post(
  '/:id/approve',
  requireHRManagerPlus,
  timeOffRequestController.approveTimeOffRequest
);
router.post(
  '/:id/refuse',
  requireHRManagerPlus,
  timeOffRequestController.refuseTimeOffRequest
);

module.exports = router;
