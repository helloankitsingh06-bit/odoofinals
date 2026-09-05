import { Router } from 'express';
import { register, login, getMe, listUsers, resetPassword, changePassword } from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, authorizeRoles(Role.Admin), listUsers);

export default router;

