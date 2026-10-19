import { Router } from 'express';
import { 
  getGuestCards,
  uploadKyc, 
  verifyKyc, 
  mergeGuests 
} from '../controllers/guest.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';

const router = Router({ mergeParams: true });

// Multi-tenant security perimeter
router.use(requireAuth);
router.use(requirePropertyScope);

router.get('/', requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), getGuestCards);

// Guest/Staff Routes
// Note: Depending on your frontend, 'uploadKyc' might be accessible by GUESTS, 
// but for this phase, we assume staff are processing the uploads/links.
router.post('/assignments/:unitAssignmentId/kyc', requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), uploadKyc);
router.post('/kyc/upload', requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), uploadKyc);
router.patch('/kyc/verify', requireRole(['SUPER_ADMIN', 'MANAGER', 'STAFF']), verifyKyc);

// Manager/Admin Only Routes (Destructive/Merge Operations)
router.post('/merge', requireRole(['SUPER_ADMIN', 'MANAGER']), mergeGuests);

export default router;