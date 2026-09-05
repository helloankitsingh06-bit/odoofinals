import { Router } from 'express';
import { register, login, getMe, listUsers } from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, authorizeRoles(Role.Admin), listUsers);

export default router;
