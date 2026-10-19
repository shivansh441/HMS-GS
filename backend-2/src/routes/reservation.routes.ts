import { Router } from 'express';
import { 
  createReservation, 
  getReservations, 
  updateReservationStatus,
  updateReservation,
  createPublicReservation,
  getAllReservations
} from '../controllers/reservation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';

const router = Router({ mergeParams: true });

// Multi-tenant security perimeter
router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']));
router.use(requirePropertyScope);

// ============================================================================
// RESERVATION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/properties/:propertyId/reservations
 * @desc    Create new reservation with dynamic bed/room allocation
 *          - Dual-billing strategies: HOTEL (exclusive lock) vs HOSTELER (capacity lock)
 *          - Concurrent inventory exhaustion check
 *          - Customer type-based allocation logic
 * @payload {
 *   guestName: string,
 *   mobile: string,
 *   email: string,
 *   customerType: 'GUEST' | 'HOSTELER',
 *   requestedCategory: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORM',
 *   requestedType?: 'BED' | 'ROOM',
 *   requestedQuantity?: number,
 *   expectedCheckIn: ISO string,
 *   expectedCheckOut: ISO string,
 *   totalGuests: number,
 *   specialRequests?: string
 * }
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF)
 * @returns { reservation: Reservation, unitAssignments: UnitAssignment[] }
 */
router.post(
  '/',
  createReservation
);

/**
 * @route   GET /api/properties/:propertyId/reservations
 * @desc    Fetch reservations with optional status filtering
 * @query   { status?: 'APPROVED' | 'CONVERTED' | 'CANCELLED' | 'NO_SHOW' }
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF)
 * @returns { reservations: Reservation[], unitAssignments: UnitAssignment[] }
 */
router.get(
  '/',
  getReservations
);

/**
 * @route   PATCH /api/properties/:propertyId/reservations/:reservationId/status
 * @desc    Update reservation status
 *          - State machine: APPROVED → CONVERTED → (CANCELLED/NO_SHOW)
 *          - Auto-inventory release on cancellation
 * @payload { status: 'APPROVED' | 'CONVERTED' | 'CANCELLED' | 'NO_SHOW' }
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF)
 * @returns { reservation: Reservation }
 */
router.patch(
  '/:reservationId/status',
  updateReservationStatus
);

router.patch(
  '/:reservationId',
  updateReservation
);

export default router;
