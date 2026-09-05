import { Router } from 'express';
import {
  previewPayrun,
  createPayrun,
  listPayruns,
  getPayrunById,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  sendPayrunPayslips,
  downloadPayslipPdf
} from '../controllers/payrunController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

// PDF Download (Accessible by Employee for own payslip, or Payroll roles)
router.get(
  '/payslips/:id/pdf',
  downloadPayslipPdf
);

// Preview (Step 1 Wizard)
router.post(
  '/preview',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  previewPayrun
);

// List & Detail
router.get(
  '/',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  listPayruns
);

router.get(
  '/:id',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  getPayrunById
);

// Create Payrun (Step 2 Wizard Confirmation)
router.post(
  '/',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createPayrun
);

// Compute Payrun
router.post(
  '/:id/compute',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  computePayrun
);

// Validate Payrun
router.post(
  '/:id/validate',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  validatePayrun
);

// Mark as Paid (Strictly HRPayrollManager and Admin)
router.post(
  '/:id/mark-paid',
  authorizeRoles(Role.HRPayrollManager, Role.Admin),
  markPayrunPaid
);

// Dispatch Payslips via Email & PDF
router.post(
  '/:id/send-payslips',
  authorizeRoles(Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  sendPayrunPayslips
);

export default router;
