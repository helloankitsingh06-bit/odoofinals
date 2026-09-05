import { Router } from 'express';
import {
  listTimeOffTypes,
  listTimeOffTypesWithBalances,
  createTimeOffType,
  listAllocations,
  createAllocation,
  deleteAllocation,
  listRequests,
  createRequest,
  approveRequest,
  refuseRequest,
  deleteRequest
} from '../controllers/timeOffController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

// Types
router.get('/types', listTimeOffTypes);
router.get('/types/balances', listTimeOffTypesWithBalances);
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
router.delete(
  '/allocations/:id',
  authorizeRoles(Role.HRManager, Role.HRPayrollUser, Role.HRPayrollManager, Role.Admin),
  deleteAllocation
);

// Requests
router.get('/requests', listRequests);
router.post('/requests', createRequest);
router.delete('/requests/:id', deleteRequest);

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
