import { prisma } from '../utils/prisma.js';
import { validateGroupCompliance, calculateAge } from '../services/validators.js';
const isAssignmentCurrent = (assignment, now = new Date()) => {
    if (!assignment.isActive)
        return false;
    const checkIn = assignment.actualCheckIn ?? assignment.expectedCheckIn;
    const actualCheckOut = assignment.actualCheckOut;
    const expectedCheckOut = assignment.expectedCheckOut;
    const checkOut = actualCheckOut ?? expectedCheckOut;
    if (now < checkIn)
        return false;
    if (!checkOut)
        return true;
    if (actualCheckOut)
        return now < actualCheckOut;
    const checkoutEnd = new Date(checkOut);
    checkoutEnd.setHours(12, 0, 0, 0);
    return now < checkoutEnd;
};
export const getGuestCards = async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    if (!Number.isInteger(propertyId) || propertyId <= 0)
        return res.status(400).json({ error: 'Invalid property ID.' });
    try {
        const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId }, select: { id: true, name: true, type: true } });
        const isHostel = property.type.startsWith('HOSTEL_');
        const rows = await prisma.unitAssignment.findMany({
            // Long-term Hostelers live on the Residents page, not the Guest page.
            where: { unit: { propertyId }, account: { customerType: { not: 'HOSTELER' } } },
            include: {
                account: {
                    select: {
                        id: true,
                        role: true,
                        customerType: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        parentPhone: true,
                        dateOfBirth: true,
                        gender: true,
                        idType: true,
                        idNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        photoUrl: true,
                        isActive: true,
                        isDeleted: true,
                    },
                },
                unit: true,
                reservationRequest: { select: { id: true, status: true, expectedCheckIn: true, expectedCheckOut: true } },
                ...(isHostel ? {} : { accompanyingGuests: true }),
            },
            orderBy: { id: 'asc' },
        });
        console.debug('[GuestController:getGuestCards] Contact and occupant data', rows.map((row) => ({
            assignmentId: row.id,
            phone: row.account.phone,
            occupantDob: 'accompanyingGuests' in row ? row.accompanyingGuests.map((guest) => guest.dateOfBirth) : [],
        })));
        return res.json(rows.map((row) => isHostel
            ? {
                cardType: 'guest',
                propertyId,
                propertyName: property.name,
                reservationId: row.reservationRequest?.id ?? null,
                assignmentId: row.id,
                guest: {
                    ...row.account,
                    propertyIds: [propertyId],
                    unitAssignments: [{
                            id: row.id,
                            unitId: row.unitId,
                            expectedCheckIn: row.expectedCheckIn,
                            expectedCheckOut: row.expectedCheckOut,
                            unit: { propertyId },
                        }],
                },
                bed: row.unit,
                checkIn: row.actualCheckIn ?? row.expectedCheckIn,
                checkOut: row.actualCheckOut ?? row.expectedCheckOut,
                isCurrent: isAssignmentCurrent(row),
            }
            : { cardType: 'booking', propertyId, propertyName: property.name, reservationId: row.reservationRequest?.id ?? null, assignmentId: row.id, primaryGuest: row.account, room: row.unit, occupants: row.accompanyingGuests, checkIn: row.actualCheckIn ?? row.expectedCheckIn, checkOut: row.actualCheckOut ?? row.expectedCheckOut, isCurrent: isAssignmentCurrent(row) }));
    }
    catch (error) {
        console.error('[GuestController:getGuestCards]', error);
        return res.status(404).json({ error: 'Property not found.' });
    }
};
/**
 * POST /api/properties/:propertyId/assignments/:unitAssignmentId/kyc
 * Updates the Primary Account and adds Accompanying Guests while enforcing capacity and compliance.
 */
export const uploadKyc = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const unitAssignmentId = parseInt(req.params.unitAssignmentId, 10);
    const { primaryAccountKyc, accompanyingGuests } = req.body;
    try {
        const assignment = await prisma.unitAssignment.findUnique({
            where: { id: unitAssignmentId },
            include: { unit: true, account: true }
        });
        if (!assignment || assignment.unit.propertyId !== propertyId) {
            return res.status(404).json({ error: 'Unit Assignment not found.' });
        }
        // THE CAPACITY LOCK: Ensure the requested group fits in the physical room
        const requestedAccompanyingCount = accompanyingGuests ? accompanyingGuests.length : 0;
        if (1 + requestedAccompanyingCount > assignment.unit.capacity) {
            return res.status(400).json({
                error: `CAPACITY OVERLOAD: Unit capacity is ${assignment.unit.capacity}. You are attempting to check in ${1 + requestedAccompanyingCount} people.`
            });
        }
        await prisma.$transaction(async (tx) => {
            const primaryDob = new Date(primaryAccountKyc.dateOfBirth);
            const primaryAge = calculateAge(primaryDob);
            await tx.account.update({
                where: { id: assignment.accountId },
                data: {
                    idType: primaryAccountKyc.idType,
                    idNumber: primaryAccountKyc.idNumber,
                    photoUrl: primaryAccountKyc.photoUrl,
                    dateOfBirth: primaryDob,
                    gender: primaryAccountKyc.gender,
                    parentPhone: primaryAccountKyc.parentPhone ?? undefined,
                    phone: primaryAccountKyc.phone ?? undefined,
                    email: primaryAccountKyc.email ?? undefined,
                    address: primaryAccountKyc.address ?? undefined,
                    city: primaryAccountKyc.city ?? undefined,
                    state: primaryAccountKyc.state ?? undefined,
                    pincode: primaryAccountKyc.pincode ?? undefined
                }
            });
            await tx.accompanyingGuest.deleteMany({ where: { unitAssignmentId } });
            if (accompanyingGuests && accompanyingGuests.length > 0) {
                await tx.accompanyingGuest.createMany({
                    data: accompanyingGuests.map((guest) => ({
                        unitAssignmentId,
                        firstName: guest.firstName,
                        lastName: guest.lastName,
                        age: guest.age,
                        gender: guest.gender,
                        parentPhone: guest.parentPhone ?? null,
                        dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
                        idType: guest.idType,
                        idNumber: guest.idNumber,
                        photoUrl: guest.photoUrl,
                        idProofPhotoUrl: guest.idProofPhotoUrl,
                        address: guest.address,
                        city: guest.city,
                        state: guest.state,
                        pincode: guest.pincode
                    }))
                });
            }
            // Run the Social Compliance Engine
            const allOccupants = [
                { age: primaryAge, gender: primaryAccountKyc.gender, lastName: assignment.account.lastName }
            ];
            if (accompanyingGuests) {
                accompanyingGuests.forEach((g) => {
                    allOccupants.push({ age: g.age, gender: g.gender, lastName: g.lastName });
                });
            }
            const complianceCheck = validateGroupCompliance(assignment.unit.type, allOccupants);
            if (!complianceCheck.valid) {
                throw new Error(complianceCheck.code);
            }
        });
        await prisma.auditLog.create({
            data: {
                accountId: assignment.accountId,
                propertyId,
                entityType: 'UNIT_ASSIGNMENT',
                entityId: unitAssignmentId,
                action: 'UPLOAD_KYC',
                details: {
                    idType: primaryAccountKyc.idType,
                    idNumber: '***REDACTED_PII***',
                    photoUrl: '***REDACTED_PII***',
                    accompanyingCount: requestedAccompanyingCount
                },
                ipAddress: req.ip || null,
                userAgent: req.headers['user-agent'] || null
            }
        });
        return res.status(200).json({ message: 'KYC uploaded and group compliance verified.' });
    }
    catch (error) {
        if (error.message === 'TRIPLE_ROOM_GENDER_LOCK') {
            return res.status(403).json({ error: 'Mixed-gender groups of 3 are not permitted in a single private room.' });
        }
        if (error.message === 'UNDERAGE_COUPLE_RULE') {
            return res.status(403).json({ error: 'Unaccompanied minor couples are not permitted (Sibling check failed).' });
        }
        console.error('KYC Upload Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during KYC upload.' });
    }
};
/**
 * PATCH /api/properties/:propertyId/assignments/:unitAssignmentId/kyc/verify
 * Logs a manual staff verification event.
 */
export const verifyKyc = async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const unitAssignmentId = parseInt(req.params.unitAssignmentId, 10);
    const { notes } = req.body;
    try {
        await prisma.auditLog.create({
            data: {
                propertyId,
                entityType: 'UNIT_ASSIGNMENT',
                entityId: unitAssignmentId,
                action: 'MANUAL_KYC_VERIFICATION',
                details: { verified: true, notes: notes || null },
                ipAddress: req.ip || null,
                userAgent: req.headers['user-agent'] || null
            }
        });
        return res.status(200).json({ message: 'KYC verified and logged successfully.' });
    }
    catch (error) {
        console.error('KYC Verification Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during KYC verification.' });
    }
};
/**
 * POST /api/guests/merge
 * Safely merges duplicate accounts while protecting active in-house stays.
 */
export const mergeGuests = async (req, res) => {
    const { sourceAccountId, targetAccountId } = req.body;
    if (sourceAccountId === targetAccountId) {
        return res.status(400).json({ error: 'Source and target accounts cannot be the same.' });
    }
    try {
        await prisma.$transaction(async (tx) => {
            const sourceAccount = await tx.account.findUnique({
                where: { id: sourceAccountId },
                include: {
                    unitAssignments: {
                        where: { actualCheckIn: { not: null }, actualCheckOut: null }
                    }
                }
            });
            const targetAccount = await tx.account.findUnique({ where: { id: targetAccountId } });
            if (!sourceAccount || !targetAccount)
                throw new Error('ACCOUNT_NOT_FOUND');
            if (sourceAccount.unitAssignments.length > 0) {
                throw new Error('ACTIVE_STAY_CONFLICT');
            }
            await tx.unitAssignment.updateMany({ where: { accountId: sourceAccountId }, data: { accountId: targetAccountId } });
            await tx.amenitySchedule.updateMany({ where: { accountId: sourceAccountId }, data: { accountId: targetAccountId } });
            const bubbledCustomerType = sourceAccount.customerType === 'HOSTELER' || targetAccount.customerType === 'HOSTELER'
                ? 'HOSTELER'
                : targetAccount.customerType;
            await tx.account.update({
                where: { id: targetAccountId },
                data: {
                    phone: targetAccount.phone || sourceAccount.phone,
                    email: targetAccount.email || sourceAccount.email,
                    customerType: bubbledCustomerType
                }
            });
            await tx.account.update({
                where: { id: sourceAccountId },
                data: {
                    isActive: false,
                    isDeleted: true,
                    email: sourceAccount.email ? `merged_${Date.now()}_${sourceAccount.email}` : null,
                    phone: sourceAccount.phone ? `merged_${Date.now()}_${sourceAccount.phone}` : null,
                    idNumber: sourceAccount.idNumber ? `merged_${Date.now()}_${sourceAccount.idNumber}` : null
                }
            });
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'ACCOUNT',
                entityId: targetAccountId,
                action: 'MERGE_ACCOUNTS',
                details: { mergedSourceAccountId: sourceAccountId },
                ipAddress: req.ip || null,
                userAgent: req.headers['user-agent'] || null
            }
        });
        return res.status(200).json({ message: 'Accounts merged successfully.' });
    }
    catch (error) {
        if (error.message === 'ACCOUNT_NOT_FOUND')
            return res.status(404).json({ error: 'Account not found.' });
        if (error.message === 'ACTIVE_STAY_CONFLICT')
            return res.status(409).json({ error: 'Cannot merge an account that is currently checked into a room.' });
        console.error('Account Merge Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during account merge.' });
    }
};
//# sourceMappingURL=guest.controller.js.map