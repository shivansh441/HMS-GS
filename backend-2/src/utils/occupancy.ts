import { prisma } from './prisma.js';
import { CustomerType } from '@prisma/client';

/**
 * Calculates current room capacity and enforces the Cohabitation Privacy Matrix.
 */
export const validateRoomPrivacyAndCapacity = async (
  unitId: number, 
  additionalOccupantsCount: number,
  incomingAccountId: number, 
  incomingCustomerType: CustomerType 
) => {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      unitAssignments: {
        where: { isActive: true },
        include: { account: true, accompanyingGuests: true }
      }
    }
  });

  if (!unit) throw new Error('Unit not found.');

  // 1. PHYSICAL CAPACITY CHECK
  let currentOccupants = 0;
  const activeAccountsInRoom = new Set<number>();
  let hasLongTermHosteler = false;
  let hasShortTermGuest = false;

  for (const assignment of unit.unitAssignments) {
    currentOccupants += 1; // The primary assignee
    currentOccupants += assignment.accompanyingGuests.length; // Their related guests
    
    activeAccountsInRoom.add(assignment.accountId);

    if (assignment.account.customerType === 'HOSTELER') hasLongTermHosteler = true;
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
  if (currentOccupants === 0) return { isValid: true };

  // Rule: Hosteler + Related Guest = ALLOWED
  // If the incoming person already has an active assignment in this room, they are adding a related guest.
  if (activeAccountsInRoom.has(incomingAccountId)) return { isValid: true };

  // Hotel rooms are strictly private; no sharing across different primary accounts.
  if (incomingCustomerType === 'HOTEL_GUEST') {
    return { isValid: false, error: 'PRIVACY LOCK: Private hotel rooms cannot be shared across different primary accounts.' };
  }

  // HOSTEL RULES:
  // A temporary hosteler (HOSTEL_GUEST) can occupy an available bed in a shared room or
  // dormitory that contains permanent hostelers (HOSTELER), provided the unit's capacity allows it.
  return { isValid: true };
};