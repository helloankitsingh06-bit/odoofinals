import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get(
  '/metrics',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  getDashboardMetrics
);

export default router;
