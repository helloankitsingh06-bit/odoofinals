import { Router, Response, NextFunction } from 'express';
import {
  listEmployees,
  getEmployeeById,
  getMyEmployeeDetails,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

// Current logged-in employee profile (Self-Service)
router.get('/me', getMyEmployeeDetails);

router.get(
  '/',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  listEmployees
);

router.get(
  '/:id',
  (req: AuthRequest, res: Response, next: NextFunction) => {
    // If Employee, allow if it's their own id
    if (req.user?.role === Role.Employee) {
      if (req.user.employeeId !== req.params.id) {
        res.status(403).json({ error: 'Access forbidden: Can only view your own employee record' });
        return;
      }
    }
    next();
  },
  getEmployeeById
);

router.post(
  '/',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createEmployee
);

router.put(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  updateEmployee
);

router.delete(
  '/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  deleteEmployee
);

export default router;
