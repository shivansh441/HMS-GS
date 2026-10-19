import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/website-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HTTP-only cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Transform backend user data to match frontend User interface
      const user: User = {
        id: data.user.id,
        name: `${data.user.firstName} ${data.user.lastName}`,
        email: data.user.email,
        role: data.user.role === 'CUSTOMER' ? 'resident' : data.user.role.toLowerCase() as 'admin' | 'resident',
      };

      set({ 
        user, 
        token: data.accessToken, 
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.message || err || 'Authentication failed. Please check your credentials.', 
        loading: false 
      });
      throw err;
    }
  },

  register: async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HTTP-only cookies
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Registration failed with status ${response.status}`);
      }

      // Transform backend user data to match frontend User interface
      const user: User = {
        id: responseData.user.id,
        name: `${responseData.user.firstName} ${responseData.user.lastName}`,
        email: responseData.user.email,
        role: responseData.user.role === 'CUSTOMER' ? 'resident' : responseData.user.role.toLowerCase() as 'admin' | 'resident',
      };

      set({ 
        user, 
        token: responseData.accessToken, 
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.message || 'Registration failed. Please check your connection and try again.', 
        loading: false 
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important for HTTP-only cookies
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, token: null, error: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  initializeAuth: () => {
    const persistedAuth = get();
    if (persistedAuth.token && persistedAuth.user) {
      // Auth state is already restored from localStorage by persist middleware
      console.log('Auth state restored from storage');
    }
  }
}),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);