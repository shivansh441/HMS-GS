export type PropertyType = 'HOSTEL_BOYS' | 'HOSTEL_GIRLS' | 'HOSTEL_COED' | 'HOTEL' | 'CO_LIVING';

export type PropertyStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

export interface Property {
  id: number;
  name: string;
  type?: PropertyType;
  floors?: number;
  address?: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  facilities?: string[];
  latitude?: number | null;
  longitude?: number | null;
  status?: PropertyStatus;
  currency?: string | null;
  standardMessRate?: number | string | null;
  managers?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
}

// Unit type moved to src/types/unit.types.ts
