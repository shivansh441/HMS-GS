import { API_BASE_URL } from '../config/env.config';

export interface HotelOccupant {
  isPrimary?: boolean;
  firstName: string;
  lastName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  phone?: string | null;
  parentPhone?: string | null;
  age?: number;
  dateOfBirth?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  idType?: string;
  idNumber: string;
  photoUrl?: string;
  idProofPhotoUrl?: string;
}

export interface HotelBookingPayload {
  existingAccountId?: number;
  propertyId: number;
  unitId: number;
  guestName: string;
  mobile: string;
  parentPhone?: string;
  email?: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  idType?: string;
  idNumber: string;
  photoUrl?: string;
  idProofPhotoUrl?: string;
  customerType: 'HOTEL_GUEST' | 'HOSTEL_GUEST';
  requestedCategory: string;
  requestedType: 'BED' | 'ROOM' | 'SUITE';
  requestedQuantity: 1;
  numberOfAdults: number;
  numberOfChildren: number;
  expectedCheckIn: string;
  expectedCheckOut: string;
  bookingSource?: 'MANUAL' | 'WEBSITE';
  occupants: HotelOccupant[];
}

export interface ReservationUpdatePayload {
  guestName?: string;
  mobile?: string;
  email?: string | null;
  expectedCheckIn?: string;
  expectedCheckOut?: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
}

export const createHotelBookingApi = async (payload: HotelBookingPayload, token: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${payload.propertyId}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || 'Failed to create hotel booking') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const updateReservationApi = async (propertyId: number, reservationId: number, payload: ReservationUpdatePayload, token: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/reservations/${reservationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Failed to update booking dates') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data;
};
