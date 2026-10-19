import { prisma } from '../utils/prisma.js';
import { ensureUnitIsFreeForInterval } from '../services/reservation-conversion.service.js';
import { calculateIsCustomRate, resolveAgreedRate } from '../utils/agreed-rate.js';
/**
 * Validates if a unit is available for a specific time window.
 * Addresses the Concurrency Vulnerability using strict overlapping queries.
 */
const ensureUnitAvailability = async (tx, unitId, checkIn, checkOut) => {
    // Check 1: Overlapping Active Assignments
    const overlappingAssignment = await tx.unitAssignment.findFirst({
        where: {
            unitId,
            isActive: true,
            actualCheckOut: null, // Only care if they haven't checked out
            AND: [
                { expectedCheckIn: { lt: checkOut || new Date('2099-12-31') } },
                { OR: [
                        { expectedCheckOut: { gt: checkIn } },
                        { expectedCheckOut: null } // Indefinite stays block everything
                    ]
                }
            ]
        }
    });
    if (overlappingAssignment)
        throw new Error('CONCURRENCY_CONFLICT:UNIT_OCCUPIED');
    // Check 2: Overlapping Maintenance Blocks
    const overlappingBlock = await tx.unitBlock.findFirst({
        where: {
            unitId,
            AND: [
                { startDate: { lt: checkOut || new Date('2099-12-31') } },
                { endDate: { gt: checkIn } }
            ]
        }
    });
    if (overlappingBlock)
        throw new Error('CONCURRENCY_CONFLICT:UNIT_BLOCKED');
};
/**
 * PATCH /properties/:propertyId/assignments/:assignmentId/swap
 * Safely swaps a guest to a new room and flags rate discrepancies.
 */
export const swapUnit = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const { newUnitId, notes } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const assignment = await tx.unitAssignment.findUnique({
                where: { id: assignmentId },
                include: { unit: true }
            });
            if (!assignment || assignment.unit.propertyId !== propertyId) {
                throw new Error('ASSIGNMENT_NOT_FOUND');
            }
            if (assignment.actualCheckOut) {
                throw new Error('ALREADY_CHECKED_OUT');
            }
            const newUnit = await tx.unit.findUnique({ where: { id: newUnitId } });
            if (!newUnit || newUnit.propertyId !== propertyId) {
                throw new Error('NEW_UNIT_NOT_FOUND');
            }
            // 1. Concurrency Check
            await ensureUnitAvailability(tx, newUnitId, assignment.expectedCheckIn, assignment.expectedCheckOut);
            // 2. The Rate Discrepancy Trap
            const oldRate = assignment.unit.defaultPricePerNight?.toNumber() ?? 0;
            const newRate = newUnit.defaultPricePerNight?.toNumber() ?? 0;
            const rateDiscrepancy = {
                oldUnitId: assignment.unitId,
                newUnitId: newUnit.id,
                oldRate,
                newRate,
                difference: newRate - oldRate,
                requiresLedgerAdjustment: oldRate !== newRate
            };
            // 3. The Occupied Deletion Trap: Update ONLY the unit link
            await tx.unitAssignment.update({
                where: { id: assignmentId },
                data: {
                    unitId: newUnitId,
                    notes: notes ? `${assignment.notes || ''}\n[SWAP]: ${notes}` : assignment.notes
                }
            });
            // 4. Audit Log (JSON Payload explicitly stating ledger actions required)
            await tx.auditLog.create({
                data: {
                    accountId: assignment.accountId,
                    propertyId,
                    entityType: 'UNIT_ASSIGNMENT',
                    entityId: assignmentId,
                    action: 'ROOM_SWAP',
                    details: { discrepancyPayload: rateDiscrepancy, notes },
                    ipAddress: req.ip || null
                }
            });
            return rateDiscrepancy;
        });
        return res.status(200).json({
            message: 'Room swap executed successfully.',
            discrepancy: result
        });
    }
    catch (error) {
        if (error.message.startsWith('CONCURRENCY_CONFLICT'))
            return res.status(409).json({ error: 'Target room was booked or blocked in the last millisecond.' });
        if (error.message === 'ALREADY_CHECKED_OUT')
            return res.status(400).json({ error: 'Cannot swap a guest who has already checked out.' });
        if (error.message === 'ASSIGNMENT_NOT_FOUND')
            return res.status(404).json({ error: 'Assignment not found.' });
        console.error('Room Swap Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during room swap.' });
    }
};
/**
 * POST /properties/:propertyId/assignments/:assignmentId/emergency-relocation
 * The Midnight Pipe Burst: Swaps guest and instantly enforces a MAINTENANCE block on the old room.
 */
export const emergencyRelocation = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const { newUnitId, blockReasonDescription, blockUntil } = req.body;
    // Default block duration: 48 hours if not explicitly provided
    const endDate = blockUntil ? new Date(blockUntil) : new Date(Date.now() + 48 * 60 * 60 * 1000);
    try {
        const result = await prisma.$transaction(async (tx) => {
            const assignment = await tx.unitAssignment.findUnique({
                where: { id: assignmentId },
                include: { unit: true }
            });
            if (!assignment || assignment.unit.propertyId !== propertyId)
                throw new Error('ASSIGNMENT_NOT_FOUND');
            if (assignment.actualCheckOut)
                throw new Error('ALREADY_CHECKED_OUT');
            const oldUnitId = assignment.unitId;
            // 1. Verify New Room Availability (Concurrency Gate)
            await ensureUnitAvailability(tx, newUnitId, assignment.expectedCheckIn, assignment.expectedCheckOut);
            // 2. Safely Reallocate the Guest
            await tx.unitAssignment.update({
                where: { id: assignmentId },
                data: {
                    unitId: newUnitId,
                    notes: `[EMERGENCY RELOCATION from Unit ${assignment.unit.unitNumber}]`
                }
            });
            // 3. Instant Maintenance Block on Old Room
            const block = await tx.unitBlock.create({
                data: {
                    unitId: oldUnitId,
                    reason: 'MAINTENANCE',
                    description: blockReasonDescription || 'Emergency Relocation Block',
                    startDate: new Date(),
                    endDate
                }
            });
            // 4. Detailed Audit Trail
            await tx.auditLog.create({
                data: {
                    accountId: assignment.accountId,
                    propertyId,
                    entityType: 'UNIT_ASSIGNMENT',
                    entityId: assignmentId,
                    action: 'EMERGENCY_RELOCATION',
                    details: {
                        oldUnitId,
                        newUnitId,
                        maintenanceBlockId: block.id,
                        blockEndDate: endDate
                    },
                    ipAddress: req.ip || null
                }
            });
            return { oldUnitId, newUnitId, maintenanceBlockId: block.id };
        });
        return res.status(200).json({
            message: 'Emergency relocation complete. Old room secured for maintenance.',
            data: result
        });
    }
    catch (error) {
        if (error.message.startsWith('CONCURRENCY_CONFLICT'))
            return res.status(409).json({ error: 'Target relocation room is unavailable.' });
        if (error.message === 'ALREADY_CHECKED_OUT')
            return res.status(400).json({ error: 'Guest already checked out.' });
        if (error.message === 'ASSIGNMENT_NOT_FOUND')
            return res.status(404).json({ error: 'Assignment not found.' });
        console.error('Emergency Relocation Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during emergency relocation.' });
    }
};
/**
 * POST /properties/:propertyId/assignments
 * Create a manual unit assignment for an existing account (hosteler or guest).
 * Payload: { unitId: number, accountId: number, expectedCheckIn: ISOString, expectedCheckOut?: ISOString }
 */
export const updateAssignment = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const { expectedCheckIn, expectedCheckOut } = req.body;
    try {
        const updatedAssignment = await prisma.$transaction(async (tx) => {
            const assignment = await tx.unitAssignment.findUnique({
                where: { id: assignmentId },
                include: { unit: true },
            });
            if (!assignment || assignment.unit.propertyId !== propertyId)
                throw new Error('ASSIGNMENT_NOT_FOUND');
            const nextCheckIn = expectedCheckIn ? new Date(expectedCheckIn) : assignment.expectedCheckIn;
            const nextCheckOut = expectedCheckOut !== undefined ? (expectedCheckOut ? new Date(expectedCheckOut) : null) : assignment.expectedCheckOut;
            if (nextCheckOut && nextCheckIn >= nextCheckOut)
                throw new Error('INVALID_DATES');
            await ensureUnitIsFreeForInterval(tx, assignment.unitId, nextCheckIn, nextCheckOut, assignment.id);
            const updatedAssignment = await tx.unitAssignment.update({
                where: { id: assignmentId },
                data: {
                    expectedCheckIn: nextCheckIn,
                    expectedCheckOut: nextCheckOut,
                },
            });
            if (assignment.reservationRequestId) {
                await tx.reservationRequest.update({
                    where: { id: assignment.reservationRequestId },
                    data: { expectedCheckIn: nextCheckIn, expectedCheckOut: nextCheckOut },
                });
            }
            return updatedAssignment;
        });
        return res.status(200).json({ assignment: updatedAssignment });
    }
    catch (error) {
        if (error.message === 'ASSIGNMENT_NOT_FOUND')
            return res.status(404).json({ error: 'Assignment not found for this property.' });
        if (error.message === 'INVALID_DATES')
            return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
        console.error('Update Assignment Error:', error);
        return res.status(500).json({ error: 'Failed to update assignment dates.' });
    }
};
export const createAssignment = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const { unitId, accountId, expectedCheckIn, expectedCheckOut, agreedPricePerNight, agreedMonthlyRate } = req.body;
    try {
        const assignment = await prisma.$transaction(async (tx) => {
            const unit = await tx.unit.findUnique({ where: { id: Number(unitId) } });
            if (!unit || unit.propertyId !== propertyId)
                throw new Error('UNIT_NOT_FOUND');
            const account = await tx.account.findUnique({ where: { id: Number(accountId) } });
            if (!account)
                throw new Error('ACCOUNT_NOT_FOUND');
            const checkIn = expectedCheckIn ? new Date(expectedCheckIn) : new Date();
            const checkOut = expectedCheckOut ? new Date(expectedCheckOut) : null;
            // Ensure unit availability for the given window
            await ensureUnitAvailability(tx, unit.id, checkIn, checkOut);
            // Derive billing strategy from account.customerType
            const billingStrategy = (account.customerType === 'HOSTELER') ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY';
            const agreedRate = resolveAgreedRate({
                billingStrategy,
                agreedPricePerNight,
                agreedMonthlyRate,
                defaultPricePerNight: unit.defaultPricePerNight,
                defaultRecurringMonthlyRate: unit.defaultRecurringMonthlyRate,
            });
            const customRate = calculateIsCustomRate({
                billingStrategy,
                agreedPricePerNight,
                agreedMonthlyRate,
                defaultPricePerNight: unit.defaultPricePerNight,
                defaultRecurringMonthlyRate: unit.defaultRecurringMonthlyRate,
            });
            const reservation = await tx.reservationRequest.create({
                data: {
                    propertyId,
                    primaryAccountId: account.id,
                    guestName: `${account.firstName} ${account.lastName}`.trim(),
                    mobile: account.phone || '',
                    email: account.email,
                    requestedCategory: unit.category,
                    requestedType: unit.type,
                    requestedCustomerType: account.customerType,
                    expectedCheckIn: checkIn,
                    expectedCheckOut: checkOut,
                    status: 'CONVERTED',
                    convertedAt: new Date(),
                    purpose: 'Manual assignment',
                },
            });
            const created = await tx.unitAssignment.create({
                data: {
                    unitId: unit.id,
                    accountId: account.id,
                    reservationRequestId: reservation.id,
                    expectedCheckIn: checkIn,
                    expectedCheckOut: checkOut,
                    isActive: true,
                    billingStrategy: billingStrategy,
                    agreedPricePerNight: billingStrategy === 'PER_NIGHT_STAY' ? agreedRate : null,
                    agreedMonthlyRate: billingStrategy === 'RECURRING_MONTHLY' ? agreedRate : null,
                    isCustomRate: customRate,
                }
            });
            await tx.auditLog.create({
                data: {
                    accountId: req.user?.id ?? null,
                    propertyId,
                    entityType: 'UNIT_ASSIGNMENT',
                    entityId: created.id,
                    action: 'MANUAL_ASSIGNMENT',
                    details: { unitId: unit.id, accountId: account.id },
                    ipAddress: req.ip || null
                }
            });
            return created;
        });
        return res.status(201).json({ assignment });
    }
    catch (error) {
        if (error.message.startsWith('CONCURRENCY_CONFLICT'))
            return res.status(409).json({ error: 'Unit unavailable in the selected time window.' });
        if (error.message === 'UNIT_NOT_FOUND')
            return res.status(404).json({ error: 'Unit not found for this property.' });
        if (error.message === 'ACCOUNT_NOT_FOUND')
            return res.status(404).json({ error: 'Account not found.' });
        if (error.message === 'MISSING_AGREED_RATE')
            return res.status(400).json({ error: 'An agreed rate is required for this assignment.' });
        console.error('Create Assignment Error:', error);
        return res.status(500).json({ error: 'Failed to create manual assignment.' });
    }
};
//# sourceMappingURL=roster.controller.js.map