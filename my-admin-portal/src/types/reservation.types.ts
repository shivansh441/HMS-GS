export interface Reservation {
  id: number;
  propertyId: number;
  guestName: string;
  mobile: string;
  email: string | null;
  requestedCategory: string;
  requestedType: string;
  requestedQuantity: number;
  requestedCustomerType: string;
  numberOfAdults: number;
  numberOfChildren: number;
  expectedCheckIn: string;
  expectedCheckOut: string | null;
  purpose: string | null;
  specialRequests: string | null;
  status: 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'CONVERTED' | 'CANCELLED' | 'NO_SHOW';
  rejectionReason: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  unitAssignments?: any[];
  financialLedgers?: any[];
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}