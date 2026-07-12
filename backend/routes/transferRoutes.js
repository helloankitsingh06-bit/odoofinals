const express = require('express');
const transferController = require('../controllers/transferController');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', transferController.listTransfers);
router.post('/', transferController.createTransfer);
router.patch('/:id/approve', requireRoles('AssetManager', 'DeptHead'), transferController.approveTransfer);
router.patch('/:id/reject', requireRoles('AssetManager', 'DeptHead'), transferController.rejectTransfer);

module.exports = router;
