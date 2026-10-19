import { prisma } from '../utils/prisma.js';
// ============================================================================
// 1. PUBLIC HOLIDAYS (Property Level)
// ============================================================================
export const addPublicHoliday = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const { name, date, isNational } = req.body;
        if (!name || !date) {
            return res.status(400).json({ error: 'Holiday name and date are required.' });
        }
        const holidayDate = new Date(date);
        // Prevent adding a holiday that already exists on this exact date
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
    }
    catch (error) {
        console.error('[HR: addPublicHoliday]', error);
        return res.status(500).json({ error: 'Failed to add public holiday.' });
    }
};
export const getPublicHolidays = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
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
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch public holidays.' });
    }
};
// ============================================================================
// 2. SALARY DEDUCTIONS (Employee Level)
// ============================================================================
export const addSalaryDeduction = async (req, res) => {
    try {
        const { targetAccountId, name, type, value } = req.body;
        if (!targetAccountId || !name || !type || value === undefined) {
            return res.status(400).json({ error: 'Missing required fields: targetAccountId, name, type, value.' });
        }
        const deductionValue = Number(value);
        // Safety Constraint 1: No negative deductions
        if (deductionValue <= 0) {
            return res.status(400).json({ error: 'Deduction value must be greater than zero.' });
        }
        // Safety Constraint 2: Prevent the "150% Tax" trap
        if (type === 'PERCENTAGE' && deductionValue > 100) {
            return res.status(400).json({ error: 'Percentage deductions cannot exceed 100%.' });
        }
        const deduction = await prisma.salaryDeduction.create({
            data: {
                accountId: targetAccountId,
                name,
                type,
                value: deductionValue,
                isActive: true
            }
        });
        return res.status(201).json({ message: 'Salary deduction added successfully.', data: deduction });
    }
    catch (error) {
        console.error('[HR: addSalaryDeduction]', error);
        return res.status(500).json({ error: 'Failed to add salary deduction.' });
    }
};
export const toggleSalaryDeduction = async (req, res) => {
    try {
        const deductionId = parseInt(req.params.deductionId, 10);
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
    }
    catch (error) {
        console.error('[HR: toggleSalaryDeduction]', error);
        return res.status(500).json({ error: 'Failed to toggle deduction status.' });
    }
};
//# sourceMappingURL=hr.controller.js.map