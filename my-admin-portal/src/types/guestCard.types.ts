import type { Account } from './account.types';

export interface GuestCardOccupant {
  id: number;
  firstName: string;
  lastName: string;
  age: number | null;
  dateOfBirth?: string | Date | null;
  gender: string | null;
  parentPhone?: string | null;
  idType: string | null;
  idNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  photoUrl?: string | null;
  idProofPhotoUrl?: string | null;
}

export interface GuestCardUnit {
  id: number;
  unitNumber: string;
  type: string;
  category: string;
  capacity: number;
  status: string;
}

export type GuestCard =
  | { cardType: 'guest'; propertyId: number; propertyName: string; propertyType?: string; reservationId: number | null; assignmentId: number; guest: Account; bed: GuestCardUnit; checkIn: string; checkOut: string | null; isCurrent: boolean }
  | { cardType: 'booking'; propertyId: number; propertyName: string; propertyType?: string; reservationId: number | null; assignmentId: number; primaryGuest: Account; room: GuestCardUnit; occupants: GuestCardOccupant[]; checkIn: string; checkOut: string | null; isCurrent: boolean };