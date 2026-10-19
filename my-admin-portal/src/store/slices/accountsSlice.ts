import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/env.config';
import type { Account } from '../../types/account.types';
import type { RootState } from '../store';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';

// Global abort controller for cancelling pending requests
let currentAbortController: AbortController | null = null; 

interface AccountsState {
  items: Account[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentRequestKey: string | null; // Track current request to prevent duplicates
}



const initialState: AccountsState = {
  items: [],
  status: 'idle',
  error: null,
  currentRequestKey: null,
};

const getAuthHeaders = (state: RootState) => {
  const token = state.auth?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const accountMutation = async (
  url: string,
  payload: Partial<Account>,
  method: 'POST' | 'PATCH',
  getState: () => RootState,
  dispatch: (action: ReturnType<typeof updateAccessToken>) => void,
) => {
  const send = (token: string | null | undefined) => fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  let response = await send(getState().auth?.accessToken);
  if (response.status === 401) {
    const refreshed = await refreshTokenApi();
    dispatch(updateAccessToken(refreshed.accessToken));
    response = await send(refreshed.accessToken);
  }
  return response;
};

export const fetchAccounts = createAsyncThunk<Account[], { role?: string; accountType?: string; propertyId?: string; propertyIds?: string; authUserId?: number; authUserRole?: string } | undefined, { state: RootState }>(
  'accounts/fetchAccounts',
  async (query = {}, { getState, rejectWithValue }) => {
    if (!getState().auth?.isAuthenticated || !getState().auth.user || !getState().auth.accessToken) {
      return rejectWithValue('Authentication required');
    }

    // Cancel any pending request
    if (currentAbortController) {
      currentAbortController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    currentAbortController = abortController;

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (query?.role) {
        params.append('role', query.role);
      }
      if (query?.accountType) {
        params.append('accountType', query.accountType);
      }
      if (query?.propertyId) {
        params.append('propertyId', query.propertyId);
      }
      if (query?.propertyIds) {
        params.append('propertyIds', query.propertyIds);
      }
      if (query?.authUserId !== undefined) {
        params.append('authUserId', String(query.authUserId));
      }
      if (query?.authUserRole) {
        params.append('authUserRole', query.authUserRole);
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      console.debug('[Accounts] Fetch employees', {
        query: Object.fromEntries(params.entries()),
      });
      const res = await fetch(`${API_BASE_URL}/api/accounts${queryString}`, {
        headers: getAuthHeaders(getState()),
        credentials: 'include',
        signal: abortController.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      const payload = await res.json();
      console.debug('[Accounts] Employee response', {
        count: Array.isArray(payload) ? payload.length : 0,
        accountIds: Array.isArray(payload) ? payload.map((account: Account) => account.id) : [],
      });
      return payload as Account[];
    } catch (error) {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch accounts');
    } finally {
      // Clear the abort controller if this was the active request
      if (currentAbortController === abortController) {
        currentAbortController = null;
      }
    }
  }
);

export const addAccount = createAsyncThunk<Account, Partial<Account>, { state: RootState }>(
  'accounts/addAccount',
  async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await accountMutation(`${API_BASE_URL}/api/accounts`, payload, 'POST', getState, dispatch);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create account');
      }
      const data = await res.json();
      return data.account as Account;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create account');
    }
  }
);

export const updateAccount = createAsyncThunk<Account, Partial<Account> & { id: number }, { state: RootState }>(
  'accounts/updateAccount',
  async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await accountMutation(`${API_BASE_URL}/api/accounts/${payload.id}`, payload, 'PATCH', getState, dispatch);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[Accounts] Update account failed', {
          status: res.status,
          statusText: res.statusText,
          accountId: payload.id,
          error: data.error,
          response: data,
          payload,
        });
        throw new Error(data.error || 'Failed to update account');
      }
      const data = await res.json();
      return data.account as Account;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update account');
    }
  }
);

export const deleteAccount = createAsyncThunk<Account, number, { state: RootState }>(
  'accounts/deleteAccount',
  async (id, { getState, rejectWithValue }) => {
    const abortController = new AbortController();
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(getState()),
        credentials: 'include',
        body: JSON.stringify({ isActive: false, isDeleted: true }),
        signal: abortController.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete account');
      }
      const data = await res.json();
      return data.account as Account;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete account');
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.currentRequestKey = JSON.stringify(action.meta.arg);
      })
      .addCase(fetchAccounts.fulfilled, (state, action: PayloadAction<Account[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.currentRequestKey = null;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        if (action.payload === 'Request cancelled') {
          return;
        }
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch accounts';
        state.currentRequestKey = null;
      })
      .addCase(addAccount.fulfilled, (state, action: PayloadAction<Account>) => {
        state.items.unshift(action.payload);
      })
      .addCase(addAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to create account';
      })
      .addCase(updateAccount.fulfilled, (state, action: PayloadAction<Account>) => {
        const index = state.items.findIndex((account) => account.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to update account';
      })
      .addCase(deleteAccount.fulfilled, (state, action: PayloadAction<Account>) => {
        state.items = state.items.filter((account) => account.id !== action.payload.id);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to delete account';
      });
  },
});

export default accountsSlice.reducer;
