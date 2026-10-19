import { Router } from 'express';
import { getAllReservations } from '../controllers/reservation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

/**
 * @route   GET /api/reservations
 * @desc    Fetch all reservations (SUPER_ADMIN) or manager's property reservations
 * @query   { status?: 'APPROVED' | 'CONVERTED' | 'CANCELLED' | 'NO_SHOW' }
 * @access  Protected (SUPER_ADMIN, MANAGER)
 * @returns { reservations: Reservation[], unitAssignments: UnitAssignment[] }
 */
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']), getAllReservations);

export default router;