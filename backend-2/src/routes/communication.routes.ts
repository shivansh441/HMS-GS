import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
import { downloadInvoicePdf, emailInvoiceToGuest } from '../controllers/communication.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requirePropertyScope);

// Route 1: Download PDF (Staff & Guest)
router.get(
  '/ledger/:ledgerId/pdf', 
  requireRole(['GUEST', 'STAFF', 'MANAGER', 'SUPER_ADMIN']), 
  downloadInvoicePdf
);

// Route 2: Trigger Invoice Email (Staff & Guest)
router.post(
  '/ledger/:ledgerId/email', 
  requireRole(['GUEST', 'STAFF', 'MANAGER', 'SUPER_ADMIN']), 
  emailInvoiceToGuest
);

export default router;