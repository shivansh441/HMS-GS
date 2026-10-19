const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Import the Property type from types to ensure consistency
import type { Property } from '../types/property.types';

export interface ManagerDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/**
 * Fetch all properties
 */
export const fetchPropertiesApi = async (token?: string): Promise<Property[]> => {
  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch properties' }));
    const error = new Error(errorData.error || 'Failed to fetch properties') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.property ?? data;
};

/**
 * Create a new property
 */
export const createPropertyApi = async (payload: Record<string, any>, token?: string): Promise<Property> => {
  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create property' }));
    const error = new Error(errorData.error || 'Failed to create property') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.property ?? data;
};

/**
 * Update an existing property
 */
export const updatePropertyApi = async (propertyId: number, payload: Record<string, any>, token?: string): Promise<Property> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/deactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update property' }));
    const error = new Error(errorData.error || 'Failed to update property') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Deactivate a property
 */
export const deactivatePropertyApi = async (propertyId: number, password: string, token?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ isDeleted: true, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to deactivate property' }));
    const error = new Error(errorData.error || 'Failed to deactivate property') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
};

/**
 * Fetch managers for property assignment
 */
export const fetchManagersApi = async (token?: string): Promise<ManagerDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/api/accounts?role=MANAGER`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch managers' }));
    throw new Error(errorData.error || 'Failed to fetch managers');
  }

  return response.json();
};

/**
 * Fetch accounts for resident assignment
 */
export const fetchAccountsApi = async (token?: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/accounts?role=CUSTOMER`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch accounts' }));
    throw new Error(errorData.error || 'Failed to fetch accounts');
  }

  return response.json();
};

/**
 * Fetch pending reservations
 */
export const fetchPendingReservationsApi = async (propertyId: number, token?: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/reservations?status=PENDING`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch reservations' }));
    throw new Error(errorData.error || 'Failed to fetch reservations');
  }

  return response.json();
};

/**
 * Create unit assignment
 */
export const createAssignmentApi = async (propertyId: number, payload: Record<string, any>, token?: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/roster/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create assignment' }));
    throw new Error(errorData.error || 'Failed to create assignment');
  }

  return response.json();
};

export const updateAssignmentApi = async (propertyId: number, assignmentId: number, payload: Record<string, any>, token?: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/roster/assignments/${assignmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update assignment');
  }

  return data;
};
