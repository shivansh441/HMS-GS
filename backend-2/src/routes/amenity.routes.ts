import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
import { 
  updatePropertyCatalog, 
  getActiveCatalog, 
  getGuestActiveAmenities 
} from '../controllers/amenity.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requirePropertyScope);

// 1. Property Catalog Routes (Prices & Menus)
// Admins update the JSON catalog
router.post('/catalog', requireRole(['MANAGER', 'SUPER_ADMIN']), updatePropertyCatalog);
// Guests and Staff view the catalog
router.get('/catalog', requireRole(['GUEST', 'STAFF', 'MANAGER', 'SUPER_ADMIN']), getActiveCatalog);

// 2. User Dashboard Route (Active Subscriptions)
// Gets what a specific user has active right now
router.get('/reservations/:reservationId/active', requireRole(['GUEST', 'STAFF', 'MANAGER', 'SUPER_ADMIN']), getGuestActiveAmenities);

export default router;