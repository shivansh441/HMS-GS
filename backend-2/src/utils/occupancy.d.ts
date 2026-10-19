import { CustomerType } from '@prisma/client';
/**
 * Calculates current room capacity and enforces the Cohabitation Privacy Matrix.
 */
export declare const validateRoomPrivacyAndCapacity: (unitId: number, additionalOccupantsCount: number, incomingAccountId: number, incomingCustomerType: CustomerType) => Promise<{
    isValid: boolean;
    error: string;
} | {
    isValid: boolean;
    error?: never;
}>;
//# sourceMappingURL=occupancy.d.ts.map