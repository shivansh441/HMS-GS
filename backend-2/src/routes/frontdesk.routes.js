import { Router } from 'express';
import { checkIn, checkOut, extendStay } from '../controllers/frontdesk.controller.js';
// Import your custom middleware pipeline
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
const router = Router();
// ============================================================================
// FRONT DESK OPERATIONS
// ============================================================================
/**
 * @route   POST /api/properties/:propertyId/reservations/:reservationId/check-in
 * @desc    Triggers guest arrival. Converts an APPROVED reservation into physical reality.
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF) + Tenant Property Scoped
 */
router.post('/properties/:propertyId/reservations/:reservationId/check-in', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), requirePropertyScope, checkIn);
/**
 * @route   POST /api/properties/:propertyId/reservations/:reservationId/check-out
 * @desc    Triggers guest departure. Releases units to AVAILABLE instantly.
 * @payload { force?: boolean } (Pass force: true for a Ghost Check-Out)
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF) + Tenant Property Scoped
 */
router.post('/properties/:propertyId/reservations/:reservationId/check-out', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), requirePropertyScope, checkOut);
/**
 * @route   PATCH /api/properties/:propertyId/reservations/:reservationId/extend
 * @desc    Extends stay window while safely guarding against the Domino Effect Trap.
 * @payload { newCheckOutDate: string }
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF) + Tenant Property Scoped
 */
router.patch('/properties/:propertyId/reservations/:reservationId/extend', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), requirePropertyScope, extendStay);
export default router;
//# sourceMappingURL=frontdesk.routes.js.map