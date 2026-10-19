import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  getStaffWorkRecords,
  saveStaffWorkRecord,
  getStaffPayrolls,
  processStaffPayroll,
  recordPayrollPayment,
  getStaffSalaryHistory,
  updateStaffSalary,
  addSalaryDeduction,
  toggleSalaryDeduction,
  getPublicHolidays,
  addPublicHoliday
} from '../controllers/hr.controller.js';

const router = Router();

// Protect all HR routes with authentication and role check
router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER']));

// 1. Monthly Working Days (Numeric administrative records, NOT attendance)
router.get('/working-days', getStaffWorkRecords);
router.post('/working-days', saveStaffWorkRecord);

// 2. Payroll Generation & Payment
router.get('/payrolls', getStaffPayrolls);
router.post('/payrolls/process', processStaffPayroll);
router.post('/payrolls/:payrollId/payment', recordPayrollPayment);

// 3. Salary Revisions & History
router.get('/accounts/:accountId/salaries', getStaffSalaryHistory);
router.post('/accounts/:accountId/salaries', updateStaffSalary);

// 4. Deductions
router.post('/deductions', addSalaryDeduction);
router.patch('/deductions/:deductionId', toggleSalaryDeduction);

// 5. Public Holidays
router.get('/properties/:propertyId/holidays', getPublicHolidays);
router.post('/properties/:propertyId/holidays', addPublicHoliday);

export default router;
