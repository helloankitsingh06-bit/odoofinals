import { Router } from 'express';
import {
  listAttendances,
  checkIn,
  checkOut,
  createManualAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get('/', listAttendances);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

router.post(
  '/manual',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createManualAttendance
);

router.put(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  updateAttendance
);

router.delete(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  deleteAttendance
);

export default router;
