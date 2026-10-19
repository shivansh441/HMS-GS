import { prisma } from '../utils/prisma.js';
/**
 * @route   POST /api/properties/:propertyId/amenities/catalog
 * @desc    ADMIN: Uploads a new JSON catalog for amenities/menus and retires the old one.
 */
export const updatePropertyCatalog = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const { name, effectiveFrom, scheduleData } = req.body;
        if (!name || !effectiveFrom || !scheduleData) {
            return res.status(400).json({ error: 'Name, effectiveFrom, and scheduleData are required.' });
        }
        const startDate = new Date(effectiveFrom);
        const result = await prisma.$transaction(async (tx) => {
            // 1. Retire the old catalog with the same name
            const existingActiveCatalogs = await tx.amenitySchedule.findMany({
                where: {
                    propertyId,
                    name, // e.g., "MESS_MENU" or "ADD_ON_PRICES"
                    isActive: true,
                    OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: startDate } }
                    ]
                }
            });
            for (const old of existingActiveCatalogs) {
                const retiredDate = new Date(startDate.getTime() - 1);
                await tx.amenitySchedule.update({
                    where: { id: old.id },
                    data: { effectiveTo: retiredDate, isActive: false }
                });
            }
            // 2. Save the new JSON Catalog
            const accountId = req.user?.id || req.account?.id || null;
            const newCatalog = await tx.amenitySchedule.create({
                data: {
                    propertyId,
                    accountId,
                    name,
                    effectiveFrom: startDate,
                    scheduleData, // The flexible JSON
                    isActive: true
                }
            });
            await tx.auditLog.create({
                data: {
                    accountId,
                    propertyId,
                    entityType: 'AMENITY_SCHEDULE',
                    entityId: newCatalog.id,
                    action: 'CATALOG_UPDATED',
                    details: { name },
                    ipAddress: req.ip || null,
                    userAgent: req.headers['user-agent'] || null
                }
            });
            return newCatalog;
        });
        return res.status(201).json({ message: 'Catalog successfully updated.', data: result });
    }
    catch (error) {
        console.error('[AmenityController: updatePropertyCatalog]', error);
        return res.status(500).json({ error: 'Failed to update property catalog.' });
    }
};
/**
 * @route   GET /api/properties/:propertyId/amenities/catalog
 * @desc    EVERYONE: Retrieves the active property catalog/menu for a given date (defaults to today).
 */
export const getActiveCatalog = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const targetDateString = req.query.date;
        const targetDate = targetDateString ? new Date(targetDateString) : new Date();
        const catalogs = await prisma.amenitySchedule.findMany({
            where: {
                propertyId,
                effectiveFrom: { lte: targetDate },
                OR: [
                    { effectiveTo: null },
                    { effectiveTo: { gte: targetDate } }
                ]
            }
        });
        return res.status(200).json({ data: catalogs });
    }
    catch (error) {
        console.error('[AmenityController: getActiveCatalog]', error);
        return res.status(500).json({ error: 'Failed to retrieve catalog.' });
    }
};
/**
 * @route   GET /api/properties/:propertyId/reservations/:reservationId/active-amenities
 * @desc    USER DASHBOARD: Checks the Financial Ledger to see what facilities the guest currently has active.
 */
export const getGuestActiveAmenities = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const reservationId = parseInt(req.params.reservationId, 10);
        const today = new Date();
        // Query the ledger: If they bought an amenity and the billing period hasn't ended, they have access.
        const activeFacilities = await prisma.financialLedger.findMany({
            where: {
                propertyId,
                reservationId,
                category: 'AMENITY_PURCHASE',
                isDeleted: false,
                status: { in: ['PAID', 'UNPAID'] }, // They have access even if unpaid, unless staff cancels it
                billingPeriodEnd: { gte: today } // The subscription is still active
            },
            select: {
                id: true,
                description: true,
                billingPeriodStart: true,
                billingPeriodEnd: true,
                totalAmount: true
            },
            orderBy: { billingPeriodEnd: 'asc' }
        });
        return res.status(200).json({ data: activeFacilities });
    }
    catch (error) {
        console.error('[AmenityController: getGuestActiveAmenities]', error);
        return res.status(500).json({ error: 'Failed to retrieve active amenities.' });
    }
};
//# sourceMappingURL=amenity.controller.js.map