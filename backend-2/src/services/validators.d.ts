import { Gender, UnitType } from '@prisma/client';
export interface GuestIdentityInput {
    age: number;
    gender: Gender | null;
    lastName: string;
}
/**
 * Calculates age precisely based on a Date of Birth
 */
export declare const calculateAge: (dob: Date, referenceDate?: Date) => number;
/**
 * Validates group compositions against strict liability laws using your schema's exact fields.
 */
export declare const validateGroupCompliance: (unitType: UnitType, occupants: GuestIdentityInput[]) => {
    valid: boolean;
    error?: string;
    code?: string;
};
//# sourceMappingURL=validators.d.ts.map