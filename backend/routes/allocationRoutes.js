const express = require('express');
const allocationController = require('../controllers/allocationController');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', allocationController.listAllocations);
router.get('/overdue', allocationController.listOverdueAllocations);
router.post('/', allocationController.createAllocation);
router.patch('/:id/return', allocationController.returnAllocation);

module.exports = router;
