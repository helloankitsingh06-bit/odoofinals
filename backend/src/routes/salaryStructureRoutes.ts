import { Router } from 'express';
import {
  listSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  listSalaryStructures,
  getSalaryStructureById,
  validateStructure,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure
} from '../controllers/salaryStructureController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

// Read-only for HRPayrollUser, HRManager (if needed for contracts), HRPayrollManager, Admin
router.get(
  '/rules',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  listSalaryRules
);

router.get(
  '/structures',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  listSalaryStructures
);

router.get(
  '/structures/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  getSalaryStructureById
);

router.post(
  '/structures/validate',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  validateStructure
);

// Mutating endpoints strictly require HRPayrollManager or Admin (HRPayrollUser is read-only)
router.post(
  '/rules',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  createSalaryRule
);

router.put(
  '/rules/:id',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  updateSalaryRule
);

router.delete(
  '/rules/:id',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  deleteSalaryRule
);

router.post(
  '/structures',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  createSalaryStructure
);

router.put(
  '/structures/:id',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  updateSalaryStructure
);

router.delete(
  '/structures/:id',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  deleteSalaryStructure
);

export default router;
