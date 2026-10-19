import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
import { assignMessFacility, createFoodOrder, getFoodMenu, getFoodOrders, getHostelMenu, getMealAssignments, saveFoodMenuItem, saveHostelMenu, updateFoodOrderStatus } from '../controllers/dining.controller.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requirePropertyScope);

router.get('/hostel/menu', requireRole(['MANAGER', 'SUPER_ADMIN']), getHostelMenu);
router.post('/hostel/menu', requireRole(['MANAGER', 'SUPER_ADMIN']), saveHostelMenu);
router.get('/hostel/assignments', requireRole(['MANAGER', 'SUPER_ADMIN']), getMealAssignments);
router.post('/hostel/assignments', requireRole(['MANAGER', 'SUPER_ADMIN']), assignMessFacility);

router.get('/hotel/menu', requireRole(['MANAGER', 'SUPER_ADMIN', 'STAFF']), getFoodMenu);
router.post('/hotel/menu', requireRole(['MANAGER', 'SUPER_ADMIN']), saveFoodMenuItem);
router.get('/hotel/orders', requireRole(['MANAGER', 'SUPER_ADMIN', 'STAFF']), getFoodOrders);
router.post('/hotel/orders', requireRole(['MANAGER', 'SUPER_ADMIN', 'STAFF']), createFoodOrder);
router.patch('/hotel/orders/:orderId/status', requireRole(['MANAGER', 'SUPER_ADMIN', 'STAFF']), updateFoodOrderStatus);

export default router;