import { Router } from 'express';
import { 
  getAccounts, 
  getCurrentAccount,
  getAccountById, 
  getAccountHistory,
  createAccount, 
  updateAccount, 
  toggleAccountStatus 
} from '../controllers/account.controller.js';

// Import your middlewares
import { requireAuth} from '../middlewares/auth.middleware.js'; 
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// ============================================================================
// INTERNAL ACCOUNT MANAGEMENT ROUTES
// Base Path: /api/accounts
// ============================================================================

// 1. Protect all account routes with Authentication
router.use(requireAuth);

// 2. Allow any authenticated user to manage their own profile first
router.get('/me', getCurrentAccount);
router.patch('/me', updateAccount);

// 3. Protect remaining account management routes with Role Authorization (Block STAFF/CUSTOMER)
router.use(requireRole(['SUPER_ADMIN', 'MANAGER']));

// Routes
router.get('/', getAccounts);
router.get('/:accountId', getAccountById);
router.get('/:accountId/history', getAccountHistory);
router.post('/', createAccount);
router.patch('/:accountId', updateAccount);
router.patch('/:accountId/status', toggleAccountStatus);

export default router;