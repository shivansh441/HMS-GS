import { prisma } from '../utils/prisma.js';
import { logAction } from '../services/audit.service.js';
import { PropertyType, UnitType, UnitCategory, UnitStatus } from '@prisma/client';
/**
 * ----------------------------------------------------------------------
 * CORE BUSINESS LOGIC ENGINES
 * ----------------------------------------------------------------------
 */
/**
 * Validates the strict intersection of Property Types, Unit Types, and Categories.
 * Prevents "Hotel Beds" and enforces AC/Non-AC tags for Hostels.
 */
const validateUnitProfile = (propertyType, type, category, features) => {
    const isHotel = propertyType === 'HOTEL';
    const isHostel = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED', 'CO_LIVING'].includes(propertyType);
    if (isHotel) {
        if (type === 'BED')
            return { valid: false, reason: 'Hotels cannot provision individual shared beds.' };
        const hotelCategories = ['CLASSIC', 'DELUXE', 'SUPER_DELUXE', 'EXECUTIVE'];
        if (!hotelCategories.includes(category))
            return { valid: false, reason: `Hotels must use hotel-specific categories (e.g., DELUXE), not ${category}.` };
    }
    if (isHostel) {
        const hostelCategories = ['SINGLE_ROOM', 'DOUBLE_ROOM', 'TRIPLE_ROOM', 'QUADRUPLE_ROOM', 'DORMITORY'];
        if (!hostelCategories.includes(category))
            return { valid: false, reason: `Hostels must use hostel-specific categories (e.g., DORMITORY), not ${category}.` };
        // Enforce AC/Non-AC tagging for Hostels
        const hasACStatus = features.some(f => f.toUpperCase() === 'AC' || f.toUpperCase() === 'NON-AC');
        if (!hasACStatus)
            return { valid: false, reason: 'Hostel units must explicitly declare "AC" or "NON-AC" in their features array.' };
    }
    return { valid: true };
};
/**
 * ----------------------------------------------------------------------
 * CONTROLLERS
 * ----------------------------------------------------------------------
 */
export const getAvailableUnits = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        if (isNaN(propertyId))
            return res.status(400).json({ error: 'Invalid property ID.' });
        const property = await prisma.property.findFirst({
            where: { id: propertyId, isDeleted: false },
            select: { id: true },
        });
        if (!property)
            return res.status(404).json({ error: 'Property not found or inactive.' });
        const { category } = req.query;
        const units = await prisma.unit.findMany({
            where: {
                propertyId,
                ...(category ? { category: category } : {}),
            },
            orderBy: { unitNumber: 'asc' },
            include: {
                unitAssignments: {
                    where: { isActive: true },
                    include: { accompanyingGuests: true }
                }
            }
        });
        console.log('[UnitController:getAvailableUnits] Returning units:', {
            accountId: req.user?.id,
            role: req.user?.role,
            propertyId,
            count: units.length,
            unitIds: units.map((unit) => unit.id),
        });
        return res.status(200).json(units);
    }
    catch (error) {
        console.error('[UnitController: getAvailableUnits]', error);
        return res.status(500).json({ error: 'Failed to fetch available inventory.' });
    }
};
export const createUnit = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        if (isNaN(propertyId))
            return res.status(400).json({ error: 'Invalid property ID.' });
        const { unitNumber, floor, type, category, capacity, defaultPricePerNight, defaultRecurringMonthlyRate, features } = req.body;
        if (!unitNumber || !type || !category)
            return res.status(400).json({ error: 'Unit number, type, and category are required.' });
        // Sanitize and check inputs
        const cleanUnitNumber = String(unitNumber).trim();
        const cleanFeatures = Array.isArray(features) ? features : [];
        const parsedCapacity = capacity !== undefined ? parseInt(capacity, 10) : 1;
        const fixedCapacity = { SINGLE_ROOM: 1, DOUBLE_ROOM: 2, TRIPLE_ROOM: 3, QUADRUPLE_ROOM: 4 };
        if (parsedCapacity < 1 || parsedCapacity > 50)
            return res.status(400).json({ error: 'Capacity must be between 1 and 50.' });
        if (fixedCapacity[category] && parsedCapacity !== fixedCapacity[category])
            return res.status(400).json({ error: `${category} capacity must be ${fixedCapacity[category]}.` });
        if ((defaultPricePerNight && defaultPricePerNight < 0) || (defaultRecurringMonthlyRate && defaultRecurringMonthlyRate < 0)) {
            return res.status(400).json({ error: 'Pricing cannot be negative.' });
        }
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property || property.isDeleted)
            return res.status(404).json({ error: 'Target property is invalid or inactive.' });
        const targetFloor = floor !== undefined ? parseInt(floor, 10) : 0;
        if (Number.isNaN(targetFloor) || targetFloor < 0 || targetFloor > property.floors) {
            return res.status(400).json({ error: `Floor mismatch. Property supports floors 0 through ${property.floors} (G+N).` });
        }
        // Strict Profile Check
        const profileCheck = validateUnitProfile(property.type, type, category, cleanFeatures);
        if (!profileCheck.valid)
            return res.status(400).json({ error: profileCheck.reason });
        // Enforce pricing strategy based on property type
        const isHostel = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED', 'CO_LIVING'].includes(property.type);
        if (isHostel) {
            // Hostels require a recurring monthly rate
            if (defaultRecurringMonthlyRate === undefined || defaultRecurringMonthlyRate === null || Number(defaultRecurringMonthlyRate) <= 0) {
                return res.status(400).json({ error: 'Hostel units require a valid defaultRecurringMonthlyRate (monthly reference price).' });
            }
        }
        else {
            // Hotels require a per-night price
            if (defaultPricePerNight === undefined || defaultPricePerNight === null || Number(defaultPricePerNight) <= 0) {
                return res.status(400).json({ error: 'Hotel units require a valid defaultPricePerNight (reference price).' });
            }
        }
        const newUnit = await prisma.unit.create({
            data: {
                propertyId,
                unitNumber: cleanUnitNumber,
                floor: targetFloor,
                type: type,
                category: category,
                capacity: parsedCapacity,
                defaultPricePerNight: defaultPricePerNight === undefined ? null : defaultPricePerNight,
                defaultRecurringMonthlyRate: defaultRecurringMonthlyRate || null,
                features: cleanFeatures,
                status: 'AVAILABLE'
            }
        });
        await logAction(req, 'UNIT', newUnit.id, 'CREATE_UNIT', { unitNumber: cleanUnitNumber });
        return res.status(201).json({ message: 'Unit created successfully.', unit: newUnit });
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(409).json({ error: 'A unit with this number already exists.' });
        console.error('[UnitController: createUnit]', error);
        return res.status(500).json({ error: 'Failed to create unit.' });
    }
};
export const createUnitsBulk = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        if (isNaN(propertyId))
            return res.status(400).json({ error: 'Invalid property ID.' });
        const { units } = req.body;
        if (!units || !Array.isArray(units) || units.length === 0) {
            return res.status(400).json({ error: 'A valid array of units is required.' });
        }
        if (units.length > 500)
            return res.status(400).json({ error: 'Upload limit exceeded. Maximum 500 units per request.' });
        // Check for duplicates inside the JSON payload itself
        const cleanUnitNumbers = units.map(u => String(u.unitNumber).trim());
        if (new Set(cleanUnitNumbers).size !== cleanUnitNumbers.length) {
            return res.status(400).json({ error: 'Duplicate unit numbers found within the upload payload.' });
        }
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property || property.isDeleted)
            return res.status(404).json({ error: 'Target property is invalid or inactive.' });
        // Pre-flight validation on every unit
        for (const unit of units) {
            const targetFloor = unit.floor !== undefined ? parseInt(unit.floor, 10) : 0;
            const parsedCapacity = unit.capacity !== undefined ? parseInt(unit.capacity, 10) : 1;
            const features = Array.isArray(unit.features) ? unit.features : [];
            if (targetFloor < 0 || targetFloor > property.floors) {
                return res.status(400).json({ error: `Unit ${unit.unitNumber} is on floor ${targetFloor}, but property has ${property.floors} floors.` });
            }
            if (parsedCapacity < 1 || parsedCapacity > 50) {
                return res.status(400).json({ error: `Unit ${unit.unitNumber} has invalid capacity (must be 1-50).` });
            }
            if ((unit.defaultPricePerNight && unit.defaultPricePerNight < 0) || (unit.defaultRecurringMonthlyRate && unit.defaultRecurringMonthlyRate < 0)) {
                return res.status(400).json({ error: `Unit ${unit.unitNumber} has negative pricing.` });
            }
            // Enforce pricing strategy per-property
            const isHostel = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED', 'CO_LIVING'].includes(property.type);
            if (isHostel) {
                if (unit.defaultRecurringMonthlyRate === undefined || unit.defaultRecurringMonthlyRate === null || Number(unit.defaultRecurringMonthlyRate) <= 0) {
                    return res.status(400).json({ error: `Unit ${unit.unitNumber} requires a valid defaultRecurringMonthlyRate for hostel properties.` });
                }
            }
            else {
                if (unit.defaultPricePerNight === undefined || unit.defaultPricePerNight === null || Number(unit.defaultPricePerNight) <= 0) {
                    return res.status(400).json({ error: `Unit ${unit.unitNumber} requires a valid defaultPricePerNight for hotel properties.` });
                }
            }
            const profileCheck = validateUnitProfile(property.type, unit.type, unit.category, features);
            if (!profileCheck.valid)
                return res.status(400).json({ error: `Unit ${unit.unitNumber}: ` + profileCheck.reason });
        }
        const payload = units.map(unit => ({
            propertyId,
            unitNumber: String(unit.unitNumber).trim(),
            floor: unit.floor !== undefined ? parseInt(unit.floor, 10) : 0,
            type: unit.type,
            category: unit.category,
            capacity: unit.capacity !== undefined ? parseInt(unit.capacity, 10) : 1,
            defaultPricePerNight: unit.defaultPricePerNight || null,
            defaultRecurringMonthlyRate: unit.defaultRecurringMonthlyRate || null,
            features: Array.isArray(unit.features) ? unit.features : [],
            status: 'AVAILABLE' // <--- Add the cast right here
        }));
        const result = await prisma.unit.createMany({
            data: payload,
            skipDuplicates: true // Prevents total failure if a few units hit a database unique constraint
        });
        await logAction(req, 'UNIT', propertyId, 'BULK_CREATE_UNITS', { requested: units.length, created: result.count });
        return res.status(201).json({ message: `Successfully provisioned ${result.count} units.`, count: result.count });
    }
    catch (error) {
        console.error('[UnitController: createUnitsBulk]', error);
        return res.status(500).json({ error: 'Failed to process bulk unit creation.' });
    }
};
export const updateUnit = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const unitId = parseInt(req.params.unitId, 10);
        if (isNaN(propertyId) || isNaN(unitId))
            return res.status(400).json({ error: 'Invalid ID parameters.' });
        const updateData = req.body;
        const existingUnit = await prisma.unit.findFirst({
            where: { id: unitId, propertyId }
        });
        if (!existingUnit)
            return res.status(404).json({ error: 'Unit not found.' });
        // Protect core immutable fields
        const protectedFields = ['id', 'propertyId', 'createdAt', 'updatedAt', 'status'];
        protectedFields.forEach(field => delete updateData[field]);
        // Fetch property early so we can validate floor and profile updates
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property || property.isDeleted)
            return res.status(404).json({ error: 'Target property is invalid or inactive.' });
        // Validate updated floor against the property floor count
        if (updateData.floor !== undefined) {
            const targetFloor = parseInt(updateData.floor, 10);
            if (Number.isNaN(targetFloor) || targetFloor < 0 || targetFloor > property.floors) {
                return res.status(400).json({ error: `Floor mismatch. Property supports floors 0 through ${property.floors} (G+N).` });
            }
            updateData.floor = targetFloor;
        }
        // THE CAPACITY REDUCTION TRAP
        if (updateData.capacity !== undefined && existingUnit.status === 'OCCUPIED') {
            const newCapacity = parseInt(updateData.capacity, 10);
            if (newCapacity < existingUnit.capacity) {
                return res.status(400).json({ error: 'Cannot reduce the capacity of a unit while it is currently occupied.' });
            }
        }
        // THE PROFILE MUTATION TRAP (property already fetched above)
        if (property) {
            const proposedType = updateData.type || existingUnit.type;
            const proposedCategory = updateData.category || existingUnit.category;
            const proposedFeatures = Array.isArray(updateData.features) ? updateData.features : existingUnit.features;
            const profileCheck = validateUnitProfile(property.type, proposedType, proposedCategory, proposedFeatures);
            if (!profileCheck.valid)
                return res.status(400).json({ error: profileCheck.reason });
            // Enforce pricing strategy when updating: ensure hostel units have monthly rate, hotels have per-night price
            const proposedPricePerNight = updateData.defaultPricePerNight !== undefined ? Number(updateData.defaultPricePerNight) : Number(existingUnit.defaultPricePerNight);
            const proposedRecurringMonthlyRate = updateData.defaultRecurringMonthlyRate !== undefined ? updateData.defaultRecurringMonthlyRate : existingUnit.defaultRecurringMonthlyRate;
            const isHostel = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED', 'CO_LIVING'].includes(property.type);
            if (isHostel) {
                if (proposedRecurringMonthlyRate === undefined || proposedRecurringMonthlyRate === null || Number(proposedRecurringMonthlyRate) <= 0) {
                    return res.status(400).json({ error: 'Hostel units require a valid defaultRecurringMonthlyRate (monthly reference price).' });
                }
            }
            else {
                if (proposedPricePerNight === undefined || Number(proposedPricePerNight) <= 0) {
                    return res.status(400).json({ error: 'Hotel units require a valid defaultPricePerNight (reference price).' });
                }
            }
        }
        if (updateData.unitNumber)
            updateData.unitNumber = String(updateData.unitNumber).trim();
        const updatedUnit = await prisma.unit.update({
            where: { id: unitId },
            data: updateData
        });
        await logAction(req, 'UNIT', updatedUnit.id, 'UPDATE_UNIT', { unitNumber: updatedUnit.unitNumber });
        return res.status(200).json({ message: 'Unit updated successfully.', unit: updatedUnit });
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(409).json({ error: 'A unit with this updated number already exists.' });
        console.error('[UnitController: updateUnit]', error);
        return res.status(500).json({ error: 'Failed to update unit.' });
    }
};
export const deleteUnit = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const unitId = parseInt(req.params.unitId, 10);
        if (isNaN(propertyId) || isNaN(unitId))
            return res.status(400).json({ error: 'Invalid ID parameters.' });
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ error: 'Session invalid: User ID missing.' });
        const administrator = await prisma.account.findUnique({ where: { id: adminId } });
        if (!administrator)
            return res.status(401).json({ error: 'Session invalid: Account not found.' });
        // 1. Fetch target unit before permanent deletion.
        const targetUnit = await prisma.unit.findFirst({
            where: { id: unitId, propertyId },
            select: { id: true, unitNumber: true },
        });
        if (!targetUnit)
            return res.status(404).json({ error: 'Unit not found.' });
        // Permanent deletion is unsafe when any assignment references this unit,
        // including historical assignments linked to financial ledger records.
        const assignment = await prisma.unitAssignment.findFirst({
            where: { unitId },
            select: { id: true },
        });
        if (assignment) {
            return res.status(409).json({
                error: 'This room has residence or reservation history and cannot be permanently deleted. Deactivate it instead.',
            });
        }
        await prisma.unit.delete({ where: { id: unitId } });
        await logAction(req, 'UNIT', unitId, 'PERMANENT_DELETE_UNIT', { approvedBy: administrator.email, unitNumber: targetUnit.unitNumber });
        return res.status(200).json({ message: 'Unit permanently deleted.' });
    }
    catch (error) {
        console.error('[UnitController: deleteUnit]', error);
        return res.status(500).json({ error: 'Internal Server Error executing permanent unit deletion.' });
    }
};
//# sourceMappingURL=unit.controller.js.map