import { Gender, UnitType } from '@prisma/client';

export interface GuestIdentityInput {
  age: number;
  gender: Gender | null;
  lastName: string;
}

/**
 * Calculates age precisely based on a Date of Birth
 */
export const calculateAge = (dob: Date, referenceDate: Date = new Date()): number => {
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/**
 * Validates group compositions against strict liability laws using your schema's exact fields.
 */
export const validateGroupCompliance = (
  unitType: UnitType,
  occupants: GuestIdentityInput[]
): { valid: boolean; error?: string; code?: string } => {
  
  // Hostel dorm beds bypass these specific private room rules
  if (unitType === 'BED') {
    return { valid: true }; 
  }

  if (occupants.length === 3) {
    const males = occupants.filter(o => o.gender === 'MALE').length;
    const females = occupants.filter(o => o.gender === 'FEMALE').length;
    
    if (males > 0 && females > 0) {
      return { 
        valid: false, 
        error: 'Mixed-gender groups of exactly 3 are strictly prohibited from sharing a private room.', 
        code: 'TRIPLE_ROOM_GENDER_LOCK' 
      };
    }
  }

  return { valid: true };
};