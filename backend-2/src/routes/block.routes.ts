import { Router } from 'express';
import { 
  getUnitBlocks, 
  createUnitBlock, 
  updateUnitBlock, 
  removeUnitBlock 
} from '../controllers/block.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';

const router = Router({ mergeParams: true });

// Multi-tenant security perimeter
router.use(requireAuth);
router.use(requirePropertyScope);

// ============================================================================
// UNIT BLOCK ROUTES (Emergency & Maintenance Blocks)
// ============================================================================

/**
 * @route   GET /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Fetch all maintenance/emergency blocks for a unit (calendar view)
 * @access  Protected (SUPER_ADMIN, MANAGER, STAFF)
 * @returns { blocks: UnitBlock[] }
 */
router.get(
  '/',
  getUnitBlocks
);

/**
 * @route   POST /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Schedule emergency or maintenance block with validation
 *          - Cannot schedule in the past (1-hour grace period)
 *          - Max duration: 180 days
 *          - Conflicts with existing assignments/blocks detected
 * @payload {
 *   reason: 'EMERGENCY' | 'MAINTENANCE',
 *   startDate: ISO string,
 *   endDate: ISO string,
 *   description: string
 * }
 * @access  Protected (SUPER_ADMIN, MANAGER) - Managers can only in their property
 * @returns { block: UnitBlock }
 */
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'MANAGER']),
  createUnitBlock
);

/**
 * @route   PATCH /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Extend/modify active or future block
 *          - Cannot modify past blocks (historical immutability)
 * @payload { endDate?: ISO string, description?: string }
 * @access  Protected (SUPER_ADMIN, MANAGER)
 * @returns { block: UnitBlock }
 */
router.patch(
  '/:blockId',
  requireRole(['SUPER_ADMIN', 'MANAGER']),
  updateUnitBlock
);

/**
 * @route   DELETE /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Lift/cancel a unit block early
 * @access  Protected (SUPER_ADMIN, MANAGER)
 * @returns { message: 'Block removed' }
 */
router.delete(
  '/:blockId',
  requireRole(['SUPER_ADMIN', 'MANAGER']),
  removeUnitBlock
);

export default router;
