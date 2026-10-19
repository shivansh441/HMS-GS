import { Router } from 'express';
import { swapUnit, emergencyRelocation, createAssignment, updateAssignment } from '../controllers/roster.controller.js';

// Import the specific middlewares from their respective files
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';

const router = Router({ mergeParams: true });

// ----------------------------------------------------------------------------
// ROSTER & REALLOCATION ROUTES
// ----------------------------------------------------------------------------

// Staff and Managers can perform standard room swaps within their assigned property
router.patch(
  '/properties/:propertyId/assignments/:assignmentId/swap',
  requireAuth,
  requireRole(['MANAGER', 'STAFF', 'SUPER_ADMIN']),
  requirePropertyScope, 
  swapUnit
);

// Emergency relocations that trigger maintenance blocks are strictly controlled
router.post(
  '/properties/:propertyId/assignments/:assignmentId/emergency-relocation',
  requireAuth,
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  requirePropertyScope,
  emergencyRelocation
);

// Manual assignment endpoint for managers/super-admins
router.post(
  '/assignments',
  requireAuth,
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  requirePropertyScope,
  createAssignment
);

router.patch(
  '/assignments/:assignmentId',
  requireAuth,
  requireRole(['MANAGER', 'SUPER_ADMIN', 'STAFF']),
  requirePropertyScope,
  updateAssignment
);

export default router;