import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { logAction } from '../services/audit.service.js';

// ============================================================================
// 1. PUBLIC HOLIDAYS (Property Level)
// ============================================================================

export const addPublicHoliday = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const { name, date, isNational } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Holiday name and date are required.' });
    }

    const holidayDate = new Date(date);

    const existing = await prisma.publicHoliday.findUnique({
      where: { propertyId_date: { propertyId, date: holidayDate } }
    });

    if (existing) {
      return res.status(400).json({ error: `A holiday already exists for this date: ${existing.name}` });
    }

    const holiday = await prisma.publicHoliday.create({
      data: {
        propertyId,
        name,
        date: holidayDate,
        isNational: isNational !== undefined ? isNational : true
      }
    });

    return res.status(201).json({ message: 'Public holiday added successfully.', data: holiday });
  } catch (error) {
    console.error('[HR: addPublicHoliday]', error);
    return res.status(500).json({ error: 'Failed to add public holiday.' });
  }
};

export const getPublicHolidays = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const holidays = await prisma.publicHoliday.findMany({
      where: {
        propertyId,
        date: { gte: startOfYear, lte: endOfYear }
      },
      orderBy: { date: 'asc' }
    });

    return res.status(200).json({ data: holidays });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch public holidays.' });
  }
};

// ============================================================================
// 2. SALARY DEDUCTIONS (Employee Level)
// ============================================================================

export const addSalaryDeduction = async (req: Request, res: Response) => {
  try {
    const { targetAccountId, name, type, value } = req.body;

    if (!targetAccountId || !name || !type || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields: targetAccountId, name, type, value.' });
    }

    const deductionValue = Number(value);

    if (deductionValue <= 0) {
      return res.status(400).json({ error: 'Deduction value must be greater than zero.' });
    }

    if (type === 'PERCENTAGE' && deductionValue > 100) {
      return res.status(400).json({ error: 'Percentage deductions cannot exceed 100%.' });
    }

    const deduction = await prisma.salaryDeduction.create({
      data: {
        accountId: Number(targetAccountId),
        name,
        type,
        value: deductionValue,
        isActive: true
      }
    });

    return res.status(201).json({ message: 'Salary deduction added successfully.', data: deduction });
  } catch (error) {
    console.error('[HR: addSalaryDeduction]', error);
    return res.status(500).json({ error: 'Failed to add salary deduction.' });
  }
};

export const toggleSalaryDeduction = async (req: Request, res: Response) => {
  try {
    const deductionId = parseInt(req.params.deductionId as string, 10);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean.' });
    }

    const updated = await prisma.salaryDeduction.update({
      where: { id: deductionId },
      data: { isActive }
    });

    const state = isActive ? 'activated' : 'deactivated';
    return res.status(200).json({ message: `Deduction successfully ${state}.`, data: updated });
  } catch (error) {
    console.error('[HR: toggleSalaryDeduction]', error);
    return res.status(500).json({ error: 'Failed to toggle deduction status.' });
  }
};

// ============================================================================
// 3. MONTHLY WORKING-DAY RECORDS (Administrative / Payroll data, NOT attendance)
// ============================================================================

export const getStaffWorkRecords = async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string | undefined;
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;

    const where: Prisma.StaffMonthlyWorkRecordWhereInput = {};
    if (period) where.payrollPeriod = period;
    if (propertyId) where.propertyId = propertyId;
    if (accountId) where.accountId = accountId;

    const records = await prisma.staffMonthlyWorkRecord.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            department: true,
            baseSalary: true,
          }
        },
        property: {
          select: { id: true, name: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { accountId: 'asc' }]
    });

    return res.json({ data: records });
  } catch (error) {
    console.error('[HR: getStaffWorkRecords]', error);
    return res.status(500).json({ error: 'Failed to fetch working day records.' });
  }
};

export const saveStaffWorkRecord = async (req: Request, res: Response) => {
  try {
    const { accountId, propertyId, payrollPeriod, workingDays, notes, status = 'APPROVED' } = req.body;
    const currentUserId = req.user?.id;

    if (!accountId || !payrollPeriod || workingDays === undefined) {
      return res.status(400).json({ error: 'accountId, payrollPeriod (YYYY-MM), and workingDays are required.' });
    }

    const [yearStr, monthStr] = String(payrollPeriod).split('-');
    const year = parseInt(yearStr || '', 10);
    const month = parseInt(monthStr || '', 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid payroll period format. Expected YYYY-MM.' });
    }

    const daysCount = Number(workingDays);
    if (!Number.isInteger(daysCount) || daysCount < 0) {
      return res.status(400).json({ error: 'Working days must be a non-negative whole number.' });
    }

    const maxDaysInMonth = new Date(year, month, 0).getDate();
    if (daysCount > maxDaysInMonth) {
      return res.status(400).json({ error: `Working days (${daysCount}) cannot exceed total days in month (${maxDaysInMonth}).` });
    }

    const record = await prisma.staffMonthlyWorkRecord.upsert({
      where: {
        accountId_payrollPeriod: {
          accountId: Number(accountId),
          payrollPeriod: String(payrollPeriod)
        }
      },
      update: {
        workingDays: daysCount,
        propertyId: propertyId ? Number(propertyId) : null,
        notes: notes ? String(notes) : null,
        status: String(status),
        recordedByAccountId: currentUserId ?? null
      },
      create: {
        accountId: Number(accountId),
        propertyId: propertyId ? Number(propertyId) : null,
        payrollPeriod: String(payrollPeriod),
        year,
        month,
        workingDays: daysCount,
        notes: notes ? String(notes) : null,
        status: String(status),
        recordedByAccountId: currentUserId ?? null
      },
      include: {
        account: {
          select: { id: true, firstName: true, lastName: true, email: true, designation: true }
        }
      }
    });

    await logAction(req, 'STAFF_WORK_RECORD', record.id, 'RECORD_WORKING_DAYS', {
      accountId,
      payrollPeriod,
      workingDays: daysCount
    });

    return res.status(200).json({ message: 'Working days recorded successfully.', data: record });
  } catch (error) {
    console.error('[HR: saveStaffWorkRecord]', error);
    return res.status(500).json({ error: 'Failed to record working days.' });
  }
};

// ============================================================================
// 4. PAYROLL ENGINE & HISTORY
// ============================================================================

export const getStaffPayrolls = async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string | undefined;
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;

    const where: Prisma.StaffPayrollRecordWhereInput = {};
    if (period) where.payrollPeriod = period;
    if (propertyId) where.propertyId = propertyId;
    if (accountId) where.accountId = accountId;

    const payrolls = await prisma.staffPayrollRecord.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            department: true,
            baseSalary: true
          }
        },
        property: {
          select: { id: true, name: true }
        },
        workRecord: {
          select: { workingDays: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { accountId: 'asc' }]
    });

    return res.json({ data: payrolls });
  } catch (error) {
    console.error('[HR: getStaffPayrolls]', error);
    return res.status(500).json({ error: 'Failed to fetch payroll records.' });
  }
};

export const processStaffPayroll = async (req: Request, res: Response) => {
  try {
    const { propertyId, payrollPeriod, accountId } = req.body;
    const currentUserId = req.user?.id;

    if (!payrollPeriod) {
      return res.status(400).json({ error: 'payrollPeriod (YYYY-MM) is required.' });
    }

    const [yearStr, monthStr] = String(payrollPeriod).split('-');
    const year = parseInt(yearStr || '', 10);
    const month = parseInt(monthStr || '', 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid payroll period format. Expected YYYY-MM.' });
    }

    // Find staff members
    const staffWhere: Prisma.AccountWhereInput = {
      role: { in: ['STAFF', 'MANAGER', 'SUPER_ADMIN'] },
      isActive: true,
      isDeleted: false,
      ...(accountId ? { id: Number(accountId) } : {}),
      ...(propertyId
        ? {
            OR: [
              { staffProperties: { some: { id: Number(propertyId) } } },
              { managedProperties: { some: { id: Number(propertyId) } } },
              { role: 'SUPER_ADMIN' }
            ]
          }
        : {})
    };

    const staffAccounts = await prisma.account.findMany({
      where: staffWhere,
      include: {
        salaryDeductions: { where: { isActive: true } },
        staffWorkRecords: { where: { payrollPeriod: String(payrollPeriod) } }
      }
    });

    if (staffAccounts.length === 0) {
      return res.status(404).json({ error: 'No active staff accounts found for the specified criteria.' });
    }

    const results = [];

    for (const employee of staffAccounts) {
      // Check existing payroll
      const existing = await prisma.staffPayrollRecord.findUnique({
        where: {
          accountId_payrollPeriod: {
            accountId: employee.id,
            payrollPeriod: String(payrollPeriod)
          }
        }
      });

      if (existing) {
        // Skip already processed payroll to prevent duplicate generation
        results.push(existing);
        continue;
      }

      const baseSalaryNum = Number(employee.baseSalary ?? 0);
      const workRecord = employee.staffWorkRecords[0] ?? null;
      const workingDays = workRecord ? workRecord.workingDays : null;

      // Calculate deductions
      let totalDeductions = 0;
      for (const deduction of employee.salaryDeductions) {
        const val = Number(deduction.value);
        if (deduction.type === 'PERCENTAGE') {
          totalDeductions += (baseSalaryNum * val) / 100;
        } else {
          totalDeductions += val;
        }
      }

      const grossSalary = baseSalaryNum;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const created = await prisma.staffPayrollRecord.create({
        data: {
          accountId: employee.id,
          propertyId: propertyId ? Number(propertyId) : null,
          payrollPeriod: String(payrollPeriod),
          year,
          month,
          baseSalary: new Prisma.Decimal(baseSalaryNum),
          workingDays,
          grossSalary: new Prisma.Decimal(grossSalary),
          totalDeductions: new Prisma.Decimal(totalDeductions),
          netSalary: new Prisma.Decimal(netSalary),
          paymentStatus: 'UNPAID',
          workRecordId: workRecord ? workRecord.id : null,
          processedByAccountId: currentUserId ?? null
        }
      });

      results.push(created);
    }

    await logAction(req, 'STAFF_PAYROLL', results[0]?.id ?? 0, 'PROCESS_PAYROLL', {
      payrollPeriod,
      count: results.length
    });

    return res.status(201).json({
      message: `Payroll processed for ${results.length} staff member(s).`,
      data: results
    });
  } catch (error) {
    console.error('[HR: processStaffPayroll]', error);
    return res.status(500).json({ error: 'Failed to process staff payroll.' });
  }
};

export const recordPayrollPayment = async (req: Request, res: Response) => {
  try {
    const payrollId = Number(req.params.payrollId);
    const { paymentMethod = 'BANK_TRANSFER', referenceId, notes } = req.body;
    const currentUserId = req.user?.id;

    const payroll = await prisma.staffPayrollRecord.findUnique({
      where: { id: payrollId }
    });

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }

    if (payroll.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'This payroll record is already marked as PAID.' });
    }

    const updated = await prisma.staffPayrollRecord.update({
      where: { id: payrollId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod as any,
        paymentDate: new Date(),
        referenceId: referenceId ? String(referenceId) : null,
        notes: notes ? String(notes) : payroll.notes,
        processedByAccountId: currentUserId ?? null
      }
    });

    await logAction(req, 'STAFF_PAYROLL', payrollId, 'PAYROLL_PAYMENT_RECORDED', {
      amount: payroll.netSalary.toString(),
      method: paymentMethod,
      referenceId
    });

    return res.json({ message: 'Payroll payment recorded successfully.', data: updated });
  } catch (error) {
    console.error('[HR: recordPayrollPayment]', error);
    return res.status(500).json({ error: 'Failed to record payroll payment.' });
  }
};

// ============================================================================
// 5. SALARY REVISION & HISTORY
// ============================================================================

export const updateStaffSalary = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.accountId);
    const { newSalary, effectiveDate = new Date(), reason } = req.body;
    const currentUserId = req.user?.id;

    if (newSalary === undefined || Number(newSalary) < 0) {
      return res.status(400).json({ error: 'A valid non-negative new salary is required.' });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, baseSalary: true }
    });

    if (!account) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const previousSalary = account.baseSalary;
    const updatedSalary = new Prisma.Decimal(newSalary);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create revision log
      const revision = await tx.staffSalaryRevision.create({
        data: {
          accountId,
          previousSalary,
          newSalary: updatedSalary,
          effectiveDate: new Date(effectiveDate),
          reason: reason ? String(reason) : null,
          changedByAccountId: currentUserId ?? null
        }
      });

      // 2. Update current account baseSalary
      await tx.account.update({
        where: { id: accountId },
        data: { baseSalary: updatedSalary }
      });

      return revision;
    });

    await logAction(req, 'ACCOUNT', accountId, 'SALARY_REVISED', {
      previousSalary: previousSalary?.toString() ?? '0',
      newSalary: newSalary.toString(),
      reason
    });

    return res.json({ message: 'Salary updated and revision history recorded.', data: result });
  } catch (error) {
    console.error('[HR: updateStaffSalary]', error);
    return res.status(500).json({ error: 'Failed to update salary.' });
  }
};

export const getStaffSalaryHistory = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.accountId);

    const revisions = await prisma.staffSalaryRevision.findMany({
      where: { accountId },
      include: {
        changedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { effectiveDate: 'desc' }
    });

    return res.json({ data: revisions });
  } catch (error) {
    console.error('[HR: getStaffSalaryHistory]', error);
    return res.status(500).json({ error: 'Failed to fetch salary revision history.' });
  }
};