import { Router } from 'express';
import { getAvailableUnits, createUnit, createUnitsBulk, updateUnit, deleteUnit, } from '../controllers/unit.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
const router = Router({ mergeParams: true });
// Multi-tenant security perimeter
router.use(requireAuth);
router.use(requirePropertyScope);
// ============================================================================
// UNIT MANAGEMENT ROUTES
// ============================================================================
/**
 * @route   GET /api/properties/:propertyId/units
 * @desc    List available units (optionally filtered by category)
 * @query   { category?: 'BED' | 'ROOM' }
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF)
 * @returns { units: Unit[] }
 */
router.get('/', getAvailableUnits);
/**
 * @route   POST /api/properties/:propertyId/units
 * @desc    Create single unit with strict validation
 *          - Hotel profile: No beds allowed
 *          - Hostel profile: Can use beds with AC/Non-AC tags
 * @payload {
 *   unitNumber: string,
 *   floor: number,
 *   type: 'ROOM' | 'BED',
 *   category: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORM',
 *   capacity: number,
 *   defaultPricePerNight?: number,
 *   defaultRecurringMonthlyRate?: number,
 *   features: string[]
 * }
 * @access  Protected (SUPER_ADMIN, MANAGER)
 * @returns { unit: Unit }
 */
router.post('/', requireRole(['SUPER_ADMIN']), createUnit);
/**
 * @route   POST /api/properties/:propertyId/units/bulk
 * @desc    Bulk create up to 500 units with pre-flight validation
 * @payload { units: Unit[] }
 * @access  Protected (SUPER_ADMIN Only) - Only for power users
 * @returns { createdCount: number, failedCount: number, errors: string[] }
 */
router.post('/bulk', requireRole(['SUPER_ADMIN']), createUnitsBulk);
/**
 * @route   PATCH /api/properties/:propertyId/units/:unitId
 * @desc    Update unit configuration
 * @payload { Partial unit fields - protects id, createdAt, updatedAt }
 * @access  Protected (SUPER_ADMIN, MANAGER)
 * @returns { unit: Unit }
 */
router.patch('/:unitId', requireRole(['SUPER_ADMIN', 'MANAGER']), updateUnit);
router.delete('/:unitId', requireRole(['SUPER_ADMIN']), deleteUnit);
export default router;
//# sourceMappingURL=unit.routes.js.map