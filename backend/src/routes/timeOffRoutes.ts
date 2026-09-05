import { Router } from 'express';
import {
  listTimeOffTypes,
  createTimeOffType,
  listAllocations,
  createAllocation,
  listRequests,
  createRequest,
  approveRequest,
  refuseRequest
} from '../controllers/timeOffController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

// Types
router.get('/types', listTimeOffTypes);
router.post(
  '/types',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createTimeOffType
);

// Allocations
router.get('/allocations', listAllocations);
router.post(
  '/allocations',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  createAllocation
);

// Requests
router.get('/requests', listRequests);
router.post('/requests', createRequest);

// Approvals & Refusals (HRManager, HRPayrollUser, HRPayrollManager, Admin)
router.post(
  '/requests/:id/approve',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  approveRequest
);

router.post(
  '/requests/:id/refuse',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  refuseRequest
);

export default router;
