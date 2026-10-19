import { CustomerType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
export function resolveCustomerType(propertyType, expectedCheckOut) {
    if (propertyType.startsWith('HOSTEL_')) {
        return expectedCheckOut === null ? CustomerType.HOSTELER : CustomerType.HOSTEL_GUEST;
    }
    return CustomerType.HOTEL_GUEST;
}
export const mapReservationOccupantToConversion = (occupant) => ({
    isPrimary: Boolean(occupant.isPrimary),
    firstName: occupant.firstName.trim(),
    lastName: occupant.lastName?.trim() ?? '',
    phone: occupant.phone ?? null,
    parentPhone: occupant.parentPhone ?? null,
    email: occupant.email ?? null,
    dateOfBirth: occupant.dateOfBirth ?? null,
    address: occupant.address ?? null,
    city: occupant.city ?? null,
    state: occupant.state ?? null,
    pincode: occupant.pincode ?? null,
    idType: occupant.idType ?? null,
    idNumber: occupant.idNumber ?? null,
    photoUrl: occupant.photoUrl ?? null,
    idProofPhotoUrl: occupant.idProofPhotoUrl ?? null,
    age: occupant.age ?? null,
    gender: occupant.gender ?? null,
});
export async function saveReservationOccupants(reservationRequestId, occupants = []) {
    if (!occupants.length)
        return [];
    const records = occupants.map((occupant) => ({
        reservationRequestId,
        accountId: occupant.accountId ?? null,
        isPrimary: Boolean(occupant.isPrimary),
        firstName: String(occupant.firstName ?? '').trim(),
        lastName: String(occupant.lastName ?? '').trim() || null,
        age: occupant.age == null ? null : Number(occupant.age),
        gender: occupant.gender,
        email: occupant.email || null,
        phone: occupant.phone || null,
        parentPhone: occupant.parentPhone || null,
        dateOfBirth: occupant.dateOfBirth ? new Date(occupant.dateOfBirth) : null,
        address: occupant.address || null,
        city: occupant.city || null,
        state: occupant.state || null,
        pincode: occupant.pincode || null,
        idType: occupant.idType,
        idNumber: occupant.idNumber || null,
        photoUrl: occupant.photoUrl || null,
        idProofPhotoUrl: occupant.idProofPhotoUrl || null,
    }));
    await prisma.reservationOccupant.createMany({ data: records });
    return records;
}
export async function loadReservationOccupants(reservationRequestId) {
    const rows = await prisma.reservationOccupant.findMany({
        where: { reservationRequestId },
        orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => mapReservationOccupantToConversion({
        isPrimary: row.isPrimary,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        parentPhone: row.parentPhone,
        email: row.email,
        dateOfBirth: row.dateOfBirth,
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        idType: row.idType ?? null,
        idNumber: row.idNumber,
        photoUrl: row.photoUrl,
        idProofPhotoUrl: row.idProofPhotoUrl,
        age: row.age,
        gender: row.gender ?? null,
    }));
}
const primaryFromReservation = (reservation) => {
    const [firstName = '', ...lastNameParts] = reservation.guestName.trim().split(/\s+/);
    return {
        isPrimary: true,
        firstName,
        lastName: lastNameParts.join(' '),
        phone: reservation.mobile,
        email: reservation.email,
    };
};
const normalizeOccupants = (reservation, occupants) => {
    const total = reservation.numberOfAdults + reservation.numberOfChildren;
    const source = occupants.length > 0 ? occupants : [primaryFromReservation(reservation)];
    if (source.length !== total)
        throw new Error('OCCUPANT_COUNT_MISMATCH');
    const primaryCount = source.filter((occupant) => occupant.isPrimary === true).length;
    if (primaryCount !== 1)
        throw new Error('PRIMARY_OCCUPANT_REQUIRED');
    return source;
};
const accountData = (occupant, customerType) => ({
    firstName: occupant.firstName.trim(),
    lastName: occupant.lastName.trim(),
    ...(occupant.email === undefined ? {} : { email: occupant.email || null }),
    ...(occupant.phone === undefined ? {} : { phone: occupant.phone || null }),
    ...(occupant.parentPhone === undefined ? {} : { parentPhone: occupant.parentPhone || null }),
    ...(occupant.dateOfBirth === undefined ? {} : { dateOfBirth: occupant.dateOfBirth ? new Date(occupant.dateOfBirth) : null }),
    ...(occupant.gender === undefined ? {} : { gender: occupant.gender }),
    ...(occupant.address === undefined ? {} : { address: occupant.address || null }),
    ...(occupant.city === undefined ? {} : { city: occupant.city || null }),
    ...(occupant.state === undefined ? {} : { state: occupant.state || null }),
    ...(occupant.pincode === undefined ? {} : { pincode: occupant.pincode || null }),
    ...(occupant.idType === undefined ? {} : { idType: occupant.idType }),
    ...(occupant.idNumber === undefined ? {} : { idNumber: occupant.idNumber || null }),
    ...(occupant.photoUrl === undefined ? {} : { photoUrl: occupant.photoUrl || null }),
    ...(occupant.idProofPhotoUrl === undefined ? {} : { idProofPhotoUrl: occupant.idProofPhotoUrl || null }),
    customerType,
});
async function resolveAccount(tx, occupant, customerType, propertyId) {
    let account = occupant.accountId
        ? await tx.account.findUnique({ where: { id: occupant.accountId } })
        : occupant.email
            ? await tx.account.findUnique({ where: { email: occupant.email } })
            : null;
    if (!account && occupant.phone)
        account = await tx.account.findFirst({ where: { phone: occupant.phone } });
    if (account) {
        return tx.account.update({
            where: { id: account.id },
            data: { ...accountData(occupant, customerType), residentProperty: { connect: { id: propertyId } } },
        });
    }
    return tx.account.create({
        data: {
            ...accountData(occupant, customerType),
            role: 'CUSTOMER',
            customerType,
            residentProperty: { connect: { id: propertyId } },
            isActive: true,
        },
    });
}
export async function ensureUnitIsFreeForInterval(tx, unitId, expectedCheckIn, expectedCheckOut, excludeAssignmentId) {
    const start = new Date(expectedCheckIn);
    const end = expectedCheckOut ? new Date(expectedCheckOut) : null;
    const unit = await tx.unit.findUnique({ where: { id: unitId }, select: { capacity: true } });
    const capacity = unit?.capacity ?? 1;
    const overlappingAssignments = await tx.unitAssignment.count({
        where: {
            unitId,
            ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
            isActive: true,
            expectedCheckIn: {
                lt: end ?? new Date('9999-12-31T23:59:59.999Z'),
            },
            OR: [
                { expectedCheckOut: null },
                { expectedCheckOut: { gt: start } },
            ],
        },
    });
    if (overlappingAssignments >= capacity) {
        throw new Error('ROOM_NOT_AVAILABLE');
    }
    const blockedByMaintenance = await tx.unitBlock.findFirst({
        where: {
            unitId,
            startDate: { lt: end ?? new Date('9999-12-31T23:59:59.999Z') },
            endDate: { gt: start },
        },
        select: { id: true },
    });
    if (blockedByMaintenance) {
        throw new Error('ROOM_NOT_AVAILABLE');
    }
}
export async function convertReservationToStay(reservationId, occupants = [], preferredUnitId) {
    return prisma.$transaction(async (tx) => {
        const reservation = await tx.reservationRequest.findUnique({
            where: { id: reservationId },
            include: {
                property: { select: { id: true, type: true } },
                unitAssignments: { select: { id: true, accountId: true, unitId: true } },
            },
        });
        if (!reservation)
            throw new Error('RESERVATION_NOT_FOUND');
        if (reservation.status === 'CONVERTED')
            return reservation;
        if (!['APPROVED', 'PENDING'].includes(reservation.status))
            throw new Error(`INVALID_RESERVATION_STATE:${reservation.status}`);
        const pendingOccupants = await loadReservationOccupants(reservation.id);
        const conversionSource = occupants.length > 0 ? occupants : pendingOccupants;
        const customerType = resolveCustomerType(reservation.property.type, reservation.expectedCheckOut);
        if (reservation.unitAssignments.length > 0) {
            await tx.account.updateMany({
                where: { id: { in: reservation.unitAssignments.map((assignment) => assignment.accountId) } },
                data: { customerType },
            });
            await tx.unit.updateMany({
                where: { id: { in: reservation.unitAssignments.map((assignment) => assignment.unitId) } },
                data: { status: 'OCCUPIED' },
            });
            return tx.reservationRequest.update({
                where: { id: reservation.id },
                data: { status: 'CONVERTED', convertedAt: new Date() },
            });
        }
        const normalized = normalizeOccupants(reservation, conversionSource);
        const totalOccupants = normalized.length;
        const isBed = reservation.requestedType === 'BED';
        const isRoom = reservation.requestedType === 'ROOM' || reservation.requestedType === 'SUITE';
        if (!isBed && !isRoom)
            throw new Error('UNSUPPORTED_UNIT_TYPE');
        const unitWhere = preferredUnitId
            ? { id: preferredUnitId, propertyId: reservation.propertyId, category: reservation.requestedCategory, type: reservation.requestedType }
            : { propertyId: reservation.propertyId, category: reservation.requestedCategory, type: reservation.requestedType, status: 'AVAILABLE' };
        const units = await tx.unit.findMany({
            where: {
                ...unitWhere,
                maintenanceBlocks: {
                    none: {
                        startDate: { lt: reservation.expectedCheckOut ?? new Date('9999-12-31') },
                        endDate: { gt: reservation.expectedCheckIn },
                    },
                },
            },
            include: {
                unitAssignments: {
                    where: {
                        isActive: true,
                        expectedCheckIn: { lt: reservation.expectedCheckOut ?? new Date('9999-12-31') },
                        OR: [
                            { expectedCheckOut: null },
                            { expectedCheckOut: { gt: reservation.expectedCheckIn } },
                        ],
                    },
                    select: { id: true },
                },
            },
            orderBy: { id: 'asc' },
        });
        const availableUnits = isRoom
            ? units.filter((unit) => unit.unitAssignments.length === 0).slice(0, 1)
            : units.flatMap((unit) => Array.from({ length: Math.max(0, unit.capacity - unit.unitAssignments.length) }, () => unit)).slice(0, totalOccupants);
        if (availableUnits.length < (isRoom ? 1 : totalOccupants))
            throw new Error('INVENTORY_CONFLICT');
        if (isRoom && totalOccupants > availableUnits[0].capacity) {
            throw new Error(`ROOM_CAPACITY:${availableUnits[0].capacity}`);
        }
        for (const unit of availableUnits) {
            await ensureUnitIsFreeForInterval(tx, unit.id, reservation.expectedCheckIn, reservation.expectedCheckOut);
        }
        const primaryIndex = normalized.findIndex((occupant) => occupant.isPrimary === true);
        const primary = normalized[primaryIndex];
        const primaryAccount = await resolveAccount(tx, primary, customerType, reservation.propertyId);
        const assignmentIds = [];
        if (isRoom) {
            const assignment = await tx.unitAssignment.create({
                data: {
                    unitId: availableUnits[0].id,
                    accountId: primaryAccount.id,
                    reservationRequestId: reservation.id,
                    billingStrategy: 'PER_NIGHT_STAY',
                    expectedCheckIn: reservation.expectedCheckIn,
                    expectedCheckOut: reservation.expectedCheckOut,
                    isActive: true,
                },
            });
            assignmentIds.push(assignment.id);
            const additional = normalized.filter((_, index) => index !== primaryIndex);
            if (additional.length > 0) {
                await tx.accompanyingGuest.createMany({
                    data: additional.map((occupant) => ({
                        unitAssignmentId: assignment.id,
                        accountId: occupant.accountId ?? null,
                        firstName: occupant.firstName.trim(),
                        lastName: occupant.lastName.trim(),
                        age: occupant.age == null ? null : Number(occupant.age),
                        gender: occupant.gender,
                        parentPhone: occupant.parentPhone || null,
                        dateOfBirth: occupant.dateOfBirth ? new Date(occupant.dateOfBirth) : null,
                        idType: occupant.idType,
                        idNumber: occupant.idNumber || null,
                        address: occupant.address || null,
                        city: occupant.city || null,
                        state: occupant.state || null,
                        pincode: occupant.pincode || null,
                        photoUrl: occupant.photoUrl || null,
                        idProofPhotoUrl: occupant.idProofPhotoUrl || null,
                    })),
                });
            }
        }
        else {
            for (let index = 0; index < normalized.length; index += 1) {
                const occupant = normalized[index];
                const account = index === primaryIndex
                    ? primaryAccount
                    : await resolveAccount(tx, occupant, customerType, reservation.propertyId);
                const assignment = await tx.unitAssignment.create({
                    data: {
                        unitId: availableUnits[index].id,
                        accountId: account.id,
                        reservationRequestId: reservation.id,
                        billingStrategy: 'RECURRING_MONTHLY',
                        expectedCheckIn: reservation.expectedCheckIn,
                        expectedCheckOut: reservation.expectedCheckOut,
                        isActive: true,
                    },
                });
                assignmentIds.push(assignment.id);
            }
        }
        for (const unit of [...new Map(availableUnits.map((unit) => [unit.id, unit])).values()].slice(0, isRoom ? 1 : normalized.length)) {
            await tx.unit.update({ where: { id: unit.id }, data: { status: 'OCCUPIED' } });
        }
        const converted = await tx.reservationRequest.update({
            where: { id: reservation.id },
            data: { status: 'CONVERTED', convertedAt: new Date() },
        });
        return { ...converted, assignmentIds };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
//# sourceMappingURL=reservation-conversion.service.js.map