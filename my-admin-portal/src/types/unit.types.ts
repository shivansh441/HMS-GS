export type UnitTypeValue = 'ROOM' | 'BED' | 'SUITE';

export interface Unit {
  id: number;
  unitNumber: string;
  floor: number;
  type: UnitTypeValue;
  category: string;
  capacity: number;
  defaultPricePerNight: number | null;
  defaultRecurringMonthlyRate: number | null;
  features: string[];
  status: string;
  unitAssignments?: any[];
}

export interface UnitFormState {
  unitNumber: string;
  floor: number;
  type: UnitTypeValue;
  category: string;
  capacity: number;
  defaultPricePerNight: number | string;
  defaultRecurringMonthlyRate: number | string;
  features: string[];
}
