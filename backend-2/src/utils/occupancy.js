import { prisma } from './prisma.js';
import { CustomerType } from '@prisma/client';
/**
 * Calculates current room capacity and enforces the Cohabitation Privacy Matrix.
 */
export const validateRoomPrivacyAndCapacity = async (unitId, additionalOccupantsCount, incomingAccountId, incomingCustomerType) => {
    const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        include: {
            unitAssignments: {
                where: { isActive: true },
                include: { account: true, accompanyingGuests: true }
            }
        }
    });
    if (!unit)
        throw new Error('Unit not found.');
    // 1. PHYSICAL CAPACITY CHECK
    let currentOccupants = 0;
    const activeAccountsInRoom = new Set();
    let hasLongTermHosteler = false;
    let hasShortTermGuest = false;
    for (const assignment of unit.unitAssignments) {
        currentOccupants += 1; // The primary assignee
        currentOccupants += assignment.accompanyingGuests.length; // Their related guests
        activeAccountsInRoom.add(assignment.accountId);
        if (assignment.account.customerType === 'HOSTELER')
            hasLongTermHosteler = true;
        if (assignment.account.customerType === 'HOSTEL_GUEST' || assignment.account.customerType === 'HOTEL_GUEST') {
            hasShortTermGuest = true;
        }
    }
    if (currentOccupants + additionalOccupantsCount > unit.capacity) {
        return {
            isValid: false,
            error: `CAPACITY OVERLOAD: Unit has capacity ${unit.capacity}. Currently holds ${currentOccupants}. Cannot add ${additionalOccupantsCount} more.`
        };
    }
    // 2. THE PRIVACY MATRIX CHECK
    // If the room is empty, anyone can check in.
    if (currentOccupants === 0)
        return { isValid: true };
    // Rule: Hosteler + Related Guest = ALLOWED
    // If the incoming person already has an active assignment in this room, they are adding a related guest.
    if (activeAccountsInRoom.has(incomingAccountId))
        return { isValid: true };
    // Hotel rooms are strictly private; no sharing across different primary accounts.
    if (incomingCustomerType === 'HOTEL_GUEST' || unit.type === 'ROOM') {
        return { isValid: false, error: 'PRIVACY LOCK: Private hotel rooms cannot be shared across different primary accounts.' };
    }
    // HOSTEL DORMITORY RULES (The Cohabitation Matrix):
    if (unit.type === 'BED' || unit.category === 'DORMITORY') {
        // Rule: Hosteler + Unrelated Guest = BLOCKED
        if (incomingCustomerType === 'HOSTEL_GUEST' && hasLongTermHosteler) {
            return { isValid: false, error: 'PRIVACY LOCK: Cannot assign a short-term Guest to a room occupied by a long-term Hosteler.' };
        }
        if (incomingCustomerType === 'HOSTELER' && hasShortTermGuest) {
            return { isValid: false, error: 'PRIVACY LOCK: Cannot assign a long-term Hosteler to a room occupied by short-term Guests.' };
        }
        // Rule: Hosteler + Hosteler = ALLOWED
        if (incomingCustomerType === 'HOSTELER' && hasLongTermHosteler && !hasShortTermGuest) {
            return { isValid: true };
        }
        // Rule: Guest + Guest = ALLOWED
        if (incomingCustomerType === 'HOSTEL_GUEST' && hasShortTermGuest && !hasLongTermHosteler) {
            return { isValid: true };
        }
    }
    return { isValid: true };
};
//# sourceMappingURL=occupancy.js.map