import { API_BASE_URL } from '../config/env.config';
import type { GuestCard } from '../types/guestCard.types';

export const getGuestCards = async (propertyId: number, token: string | null): Promise<GuestCard[]> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/guests`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to fetch guest cards');
  if (import.meta.env.DEV) {
    console.debug('[GuestCardService] Guest card contacts and occupants', data.map((card: GuestCard) => ({
      assignmentId: card.assignmentId,
      cardType: card.cardType,
      phone: card.cardType === 'guest' ? card.guest.phone : card.primaryGuest.phone,
      occupantDob: card.cardType === 'booking' ? card.occupants.map((occupant) => occupant.dateOfBirth ?? null) : [],
    })));
  }
  return data as GuestCard[];
};

export const updateGuestCardOccupants = async (propertyId: number, assignmentId: number, payload: { primaryAccountKyc: Record<string, unknown>; accompanyingGuests: unknown[] }, token: string | null) => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/guests/assignments/${assignmentId}/kyc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to update guest occupants');
};