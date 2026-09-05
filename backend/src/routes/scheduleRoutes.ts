import { Router } from 'express';
import {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../controllers/scheduleController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get('/', listSchedules);
router.get('/:id', getScheduleById);

router.post(
  '/',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createSchedule
);

router.put(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  updateSchedule
);

router.delete(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  deleteSchedule
);

export default router;
