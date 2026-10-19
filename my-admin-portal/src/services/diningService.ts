import { API_BASE_URL } from '../config/env.config';
import type { FoodMenuItem, FoodOrder, HostelWeeklyMenu } from '../types/dining.types';

const request = async <T>(url: string, token: string | null, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Dining request failed');
  return data as T;
};

export const getHostelMenus = (propertyId: number, token: string | null) => request<HostelWeeklyMenu[]>(`/api/properties/${propertyId}/dining/hostel/menu`, token);
export const saveHostelMenu = (propertyId: number, token: string | null, payload: { id?: number; weekStart?: string; suggestedMessPrice?: number; isPermanent: boolean; isPublished: boolean; items: unknown[] }) => request<HostelWeeklyMenu>(`/api/properties/${propertyId}/dining/hostel/menu`, token, { method: 'POST', body: JSON.stringify(payload) });
export const assignMessFacility = (propertyId: number, token: string | null, payload: { accountId: number; menuId: number; startDate: string; endDate?: string; monthlyRate?: number }) => request(`/api/properties/${propertyId}/dining/hostel/assignments`, token, { method: 'POST', body: JSON.stringify(payload) });
export const getFoodMenu = (propertyId: number, token: string | null) => request<FoodMenuItem[]>(`/api/properties/${propertyId}/dining/hotel/menu`, token);
export const saveFoodMenuItem = (propertyId: number, token: string | null, payload: Record<string, unknown>) => request<FoodMenuItem>(`/api/properties/${propertyId}/dining/hotel/menu`, token, { method: 'POST', body: JSON.stringify(payload) });
export const getFoodOrders = (propertyId: number, token: string | null) => request<FoodOrder[]>(`/api/properties/${propertyId}/dining/hotel/orders`, token);
export const createFoodOrder = (propertyId: number, token: string | null, payload: { reservationId: number; items: Array<{ menuItemId: number; quantity: number }>; notes?: string }) => request<FoodOrder>(`/api/properties/${propertyId}/dining/hotel/orders`, token, { method: 'POST', body: JSON.stringify(payload) });
export const updateFoodOrderStatus = (propertyId: number, token: string | null, orderId: number, status: string) => request<FoodOrder>(`/api/properties/${propertyId}/dining/hotel/orders/${orderId}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) });