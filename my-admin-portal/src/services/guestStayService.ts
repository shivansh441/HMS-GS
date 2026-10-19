import { API_BASE_URL } from '../config/env.config';

const postGuestAction = async (url: string, token: string, body?: unknown) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    credentials: 'include',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Guest action failed');
  return data;
};

export const checkoutGuest = (propertyId: number, reservationId: number, token: string) =>
  postGuestAction(`/api/properties/${propertyId}/frontdesk/properties/${propertyId}/reservations/${reservationId}/check-out`, token, {});

export const generateGuestInvoice = (propertyId: number, reservationId: number, token: string) =>
  postGuestAction(`/api/properties/${propertyId}/reservations/${reservationId}/invoice/generate`, token, { folioType: 'MAIN' });