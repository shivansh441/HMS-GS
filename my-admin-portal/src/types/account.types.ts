export type AccountRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
export type CustomerType = 'HOSTELER' | 'HOSTEL_GUEST' | 'HOTEL_GUEST' | 'NONE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type IdProofType = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID' | 'OTHER';

export interface PropertyRef {
  id: number;
  name: string;
  city?: string | null;
  type?: string | null;
}

export interface Account {
  id: number;
  role: AccountRole;
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  parentPhone: string | null;
  dateOfBirth: string | Date | null;
  gender: Gender | null;
  idType: IdProofType | null;
  idNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  photoUrl: string | null;
  department: string | null;
  designation: string | null;
  baseSalary: number | string | null;
  recurringSubsidy: number | string | null;
  joinDate: string | Date | null;
  leftDate: string | Date | null;
  isActive: boolean;
  isDeleted: boolean;
  managedProperties?: PropertyRef[];
  staffProperties?: PropertyRef[];
  residentProperty?: PropertyRef | null;
  propertyIds?: number[];
  billingStrategy?: 'PER_NIGHT_STAY' | 'RECURRING_MONTHLY';
  agreedPricePerNight?: number | string | null;
  agreedMonthlyRate?: number | string | null;
  agreedMonthlyMessRate?: number | string | null;
  isCustomRate?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  unitAssignments?: Array<{
    id: number;
    unitId: number;
    billingStrategy?: 'PER_NIGHT_STAY' | 'RECURRING_MONTHLY';
    agreedPricePerNight?: number | string | null;
    agreedMonthlyRate?: number | string | null;
    agreedMonthlyMessRate?: number | string | null;
    isCustomRate?: boolean;
    expectedCheckIn?: string | Date;
    expectedCheckOut?: string | Date | null;
    unit?: { propertyId: number };
  }>;
  hostelMealAssignments?: Array<{ monthlyRate: number | string }>;
}

export type StaffAccount = Account & { role: 'MANAGER' | 'STAFF' };
export type CustomerAccount = Account & { role: 'CUSTOMER' };

export function isStaffAccount(account: Account): account is StaffAccount {
  return account.role === 'MANAGER' || account.role === 'STAFF';
}

export function isCustomerAccount(account: Account): account is CustomerAccount {
  return account.role === 'CUSTOMER';
}
