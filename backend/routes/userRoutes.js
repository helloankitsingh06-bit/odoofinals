const express = require('express');
const userController = require('../controllers/userController');
const {
  verifyToken,
  requireAdmin,
  requireHRorPayroll,
} = require('../src/middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(verifyToken);

// User profile & sync endpoints
router.get('/me', userController.getMe);
router.post('/sync', userController.syncUser);

// User listings and inspection
router.get('/', requireHRorPayroll, userController.listUsers);
router.get('/:id', requireHRorPayroll, userController.getUser);

// Admin-only role promotion/demotion endpoint
router.patch('/:id/role', requireAdmin, userController.updateUserRole);

module.exports = router;
