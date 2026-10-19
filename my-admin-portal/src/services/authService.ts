const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login API call for admin panel authentication
 * @param email User email
 * @param password User password
 * @returns Promise with access token and user data
 */
export const loginUserApi = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies (refresh token)
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(errorData.error || 'Login failed');
  }

  return response.json();
};

/**
 * Refresh access token using refresh token from cookies
 * @returns Promise with new access token
 */
export const refreshTokenApi = async (): Promise<{ accessToken: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
};

/**
 * Logout API call
 * @returns Promise indicating successful logout
 */
export const logoutApi = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
};

/**
 * Get current user info
 * @param token Access token
 * @returns Promise with user data
 */
export const getCurrentUserApi = async (token: string): Promise<{ user: { id: number; firstName: string; lastName: string; email: string; role: string; customerType?: string } }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch user info' }));
    throw new Error(errorData.error || 'Failed to fetch user info');
  }

  return response.json();
};
