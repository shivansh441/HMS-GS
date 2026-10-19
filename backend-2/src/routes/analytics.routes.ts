import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
import { 
  getGodLevelDashboard,
  getOccupancyStats, 
  getFinancialStats, 
  exportTransactionsCSV 
} from '../controllers/analytics.controller.js';

const router = Router({ mergeParams: true });

// Global guards for this module
router.use(requireAuth);
router.use(requirePropertyScope);
router.use(requireRole(['MANAGER', 'SUPER_ADMIN'])); // Strict lock

// Endpoints
router.get('/dashboard', getGodLevelDashboard); // The High-Level Pulse
router.get('/occupancy', getOccupancyStats);    // The Occupancy Deep Dive
router.get('/financials', getFinancialStats);   // The Financial Deep Dive
router.get('/export/transactions', exportTransactionsCSV); // Download to Excel

export default router;