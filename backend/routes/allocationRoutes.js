const express = require('express');
const allocationController = require('../controllers/allocationController');
const {
  verifyToken,
  requireHRManagerPlus,
} = require('../src/middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Employee or HR can list allocations (scoped by role inside controller)
router.get('/', allocationController.listAllocations);
router.get('/:id', allocationController.getAllocationById);
router.get(
  '/balance/:employeeId/:timeOffTypeId',
  allocationController.getAvailableBalance
);

// Create, approve, delete restricted to HRManager+
router.post('/', requireHRManagerPlus, allocationController.createAllocation);
router.patch(
  '/:id/approve',
  requireHRManagerPlus,
  allocationController.approveAllocation
);
router.delete(
  '/:id',
  requireHRManagerPlus,
  allocationController.deleteAllocation
);

module.exports = router;
