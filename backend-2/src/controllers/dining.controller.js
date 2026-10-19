import { MealType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { logAction } from '../services/audit.service.js';
const propertyIdFrom = (req) => Number(req.params.propertyId);
const ensureHostelProperty = async (propertyId) => {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, type: true, standardMessRate: true }
    });
    if (!property)
        return { error: 'NOT_FOUND', status: 404, message: 'Property not found.' };
    if (property.type === 'HOTEL') {
        return { error: 'HOTEL_NOT_ALLOWED', status: 400, message: 'Hotels do not support mess, meal assignments, or restaurant dining.' };
    }
    return { property };
};
export const getHostelMenu = async (req, res) => {
    const propertyId = propertyIdFrom(req);
    const check = await ensureHostelProperty(propertyId);
    if ('error' in check)
        return res.status(check.status).json({ error: check.message });
    const weekStart = req.query.weekStart ? new Date(String(req.query.weekStart)) : undefined;
    const menus = await prisma.hostelWeeklyMenu.findMany({
        where: { propertyId, ...(weekStart ? { weekStart } : {}) },
        include: { items: { orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }] } },
        orderBy: [{ isPermanent: 'desc' }, { weekStart: 'desc' }],
    });
    return res.json(menus);
};
export const saveHostelMenu = async (req, res) => {
    const propertyId = propertyIdFrom(req);
    const check = await ensureHostelProperty(propertyId);
    if ('error' in check)
        return res.status(check.status).json({ error: check.message });
    const { id, weekStart, suggestedMessPrice, isPermanent = false, isPublished = false, items = [] } = req.body;
    if (!isPermanent && !weekStart)
        return res.status(400).json({ error: 'weekStart is required for a weekly menu.' });
    if (suggestedMessPrice !== undefined && Number(suggestedMessPrice) < 0)
        return res.status(400).json({ error: 'suggestedMessPrice must be zero or greater.' });
    if (!Array.isArray(items))
        return res.status(400).json({ error: 'Menu items must be an array.' });
    const menu = await prisma.$transaction(async (tx) => {
        const existing = id
            ? await tx.hostelWeeklyMenu.findFirst({ where: { id: Number(id), propertyId } })
            : isPermanent
                ? await tx.hostelWeeklyMenu.findFirst({ where: { propertyId, isPermanent: true } })
                : weekStart
                    ? await tx.hostelWeeklyMenu.findFirst({ where: { propertyId, weekStart: new Date(weekStart) } })
                    : null;
        const saved = existing
            ? await tx.hostelWeeklyMenu.update({ where: { id: existing.id }, data: { weekStart: weekStart ? new Date(weekStart) : null, ...(suggestedMessPrice === undefined ? {} : { suggestedMessPrice: new Prisma.Decimal(suggestedMessPrice) }), isPermanent, isPublished } })
            : await tx.hostelWeeklyMenu.create({ data: { propertyId, weekStart: weekStart ? new Date(weekStart) : null, suggestedMessPrice: suggestedMessPrice === undefined ? null : new Prisma.Decimal(suggestedMessPrice), isPermanent, isPublished } });
        await tx.hostelMenuItem.deleteMany({ where: { menuId: saved.id } });
        if (items.length) {
            await tx.hostelMenuItem.createMany({
                data: items.map((item) => ({
                    menuId: saved.id,
                    dayOfWeek: Number(item.dayOfWeek),
                    mealType: item.mealType,
                    name: String(item.name).trim(),
                    description: item.description ? String(item.description).trim() : null,
                    isAvailable: item.isAvailable !== false,
                })),
            });
        }
        return tx.hostelWeeklyMenu.findUniqueOrThrow({ where: { id: saved.id }, include: { items: true } });
    });
    return res.status(id ? 200 : 201).json(menu);
};
export const getMealAssignments = async (req, res) => {
    const propertyId = propertyIdFrom(req);
    const check = await ensureHostelProperty(propertyId);
    if ('error' in check)
        return res.status(check.status).json({ error: check.message });
    const assignments = await prisma.hostelMealAssignment.findMany({
        where: { propertyId, isActive: true },
        include: {
            account: { select: { id: true, firstName: true, lastName: true, email: true, customerType: true } },
            menu: { select: { id: true, weekStart: true, isPermanent: true } }
        },
        orderBy: { createdAt: 'desc' },
    });
    return res.json(assignments);
};
export const assignMessFacility = async (req, res) => {
    const propertyId = propertyIdFrom(req);
    const check = await ensureHostelProperty(propertyId);
    if ('error' in check)
        return res.status(check.status).json({ error: check.message });
    const { property } = check;
    const { accountId, menuId, startDate, endDate, monthlyRate } = req.body;
    if (!accountId || !startDate)
        return res.status(400).json({ error: 'accountId and startDate are required.' });
    const account = await prisma.account.findUnique({
        where: { id: Number(accountId) },
        select: { id: true, customerType: true }
    });
    if (!account || account.customerType === 'NONE') {
        return res.status(400).json({ error: 'A valid resident account is required.' });
    }
    // Temporary hostelers do not automatically receive permanent monthly mess plan
    if (account.customerType === 'HOSTEL_GUEST' && monthlyRate === undefined) {
        return res.status(400).json({ error: 'Temporary hostelers do not automatically receive a monthly mess plan without an authorized rate.' });
    }
    // Rate priority: explicitly provided monthlyRate > property standardMessRate
    let applicableRate = null;
    if (monthlyRate !== undefined && monthlyRate !== null) {
        applicableRate = Number(monthlyRate);
    }
    else if (property.standardMessRate) {
        applicableRate = Number(property.standardMessRate);
    }
    if (applicableRate === null || applicableRate < 0) {
        return res.status(400).json({ error: 'No standard monthly mess rate is configured for this hostel property. Set the standard mess rate first.' });
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;
    // Prevent duplicate active mess assignments for overlapping periods
    const overlapping = await prisma.hostelMealAssignment.findFirst({
        where: {
            accountId: Number(accountId),
            propertyId,
            isActive: true,
            startDate: { lte: parsedEndDate ?? new Date('9999-12-31') },
            OR: [
                { endDate: null },
                { endDate: { gte: parsedStartDate } }
            ]
        }
    });
    if (overlapping) {
        return res.status(409).json({ error: 'Resident already has an active mess assignment for an overlapping period.' });
    }
    const assignment = await prisma.hostelMealAssignment.create({
        data: {
            propertyId,
            accountId: Number(accountId),
            menuId: menuId ? Number(menuId) : null,
            monthlyRate: new Prisma.Decimal(applicableRate),
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            isActive: true,
        },
        include: {
            account: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
    });
    await logAction(req, 'HOSTEL_MEAL_ASSIGNMENT', assignment.id, 'ASSIGN_MESS', {
        propertyId,
        accountId: Number(accountId),
        rate: applicableRate
    });
    return res.status(201).json(assignment);
};
export const optOutMessFacility = async (req, res) => {
    const propertyId = propertyIdFrom(req);
    const check = await ensureHostelProperty(propertyId);
    if ('error' in check)
        return res.status(check.status).json({ error: check.message });
    const assignmentId = Number(req.params.assignmentId);
    const updated = await prisma.hostelMealAssignment.updateMany({
        where: { id: assignmentId, propertyId, isActive: true },
        data: { isActive: false, endDate: new Date() }
    });
    if (!updated.count) {
        return res.status(404).json({ error: 'Active mess assignment not found.' });
    }
    await logAction(req, 'HOSTEL_MEAL_ASSIGNMENT', assignmentId, 'OPT_OUT_MESS', {
        propertyId
    });
    return res.json({ message: 'Resident successfully opted out of the mess facility.' });
};
// Hotel restrictions: Hotel properties must NOT have food order or restaurant modules
export const getFoodMenu = async (req, res) => {
    return res.status(400).json({ error: 'Hotel properties do not support restaurant or food order modules.' });
};
export const saveFoodMenuItem = async (req, res) => {
    return res.status(400).json({ error: 'Hotel properties do not support restaurant or food order modules.' });
};
export const getFoodOrders = async (req, res) => {
    return res.status(400).json({ error: 'Hotel properties do not support restaurant or food order modules.' });
};
export const createFoodOrder = async (req, res) => {
    return res.status(400).json({ error: 'Hotel properties do not support restaurant or food order modules.' });
};
export const updateFoodOrderStatus = async (req, res) => {
    return res.status(400).json({ error: 'Hotel properties do not support restaurant or food order modules.' });
};
//# sourceMappingURL=dining.controller.js.map