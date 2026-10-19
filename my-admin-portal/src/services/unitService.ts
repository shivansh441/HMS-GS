const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import type { Unit } from '../types/unit.types';

/**
 * Fetch units for a property
 */
export const fetchUnitsApi = async (propertyId: number, token?: string): Promise<Unit[]> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/units`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch units' }));
    const error = new Error(errorData.error || 'Failed to fetch units') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Create a single unit
 */
export const createUnitApi = async (propertyId: number, payload: Record<string, any>, token?: string): Promise<Unit> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/units`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create unit' }));
    const error = new Error(errorData.error || 'Failed to create unit') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Create multiple units in bulk
 */
export const createUnitsBulkApi = async (propertyId: number, payload: Record<string, any>, token?: string): Promise<Unit[]> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/units/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create units' }));
    const error = new Error(errorData.error || 'Failed to create units') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Update a unit
 */
export const updateUnitApi = async (propertyId: number, unitId: number, payload: Record<string, any>, token?: string): Promise<Unit> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/units/${unitId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update unit' }));
    const error = new Error(errorData.error || 'Failed to update unit') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Delete a unit
 */
export const deleteUnitApi = async (propertyId: number, unitId: number, token?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/units/${unitId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete unit' }));
    const error = new Error(errorData.error || 'Failed to delete unit') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
};
