import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/env.config';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';
import type { Account } from '../../types/account.types';
import type { RootState } from '../store';

interface ResidentsState {
  items: Account[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  requestKey: string | null;
}

export interface FetchResidentsOptions {
  accountId: number;
  propertyIds: string[];
  force?: boolean;
}

const initialState: ResidentsState = {
  items: [],
  status: 'idle',
  error: null,
  requestKey: null,
};

export const fetchResidents = createAsyncThunk<Account[], FetchResidentsOptions, { state: RootState; rejectValue: string }>(
  'residents/fetchResidents',
  async ({ accountId, propertyIds }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    let token = state.auth?.accessToken;

    if (!state.auth?.isAuthenticated || !state.auth.user || !token) {
      console.warn('[fetchResidents] Skipped: authentication is missing');
      return rejectWithValue('Authentication required');
    }

    try {
      const params = new URLSearchParams({
        role: 'CUSTOMER',
        customerType: 'HOSTELER',
        accountId: String(accountId),
        propertyIds: propertyIds.join(','),
      });
      const requestUrl = `${API_BASE_URL}/api/accounts?${params.toString()}`;
      console.log('[fetchResidents] Requesting residents:', {
        accountId,
        propertyIds,
        propertyCount: propertyIds.length,
        requestUrl,
      });
      let response = await fetch(requestUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        console.debug('[fetchResidents] Access token expired; refreshing token');
        const refreshed = await refreshTokenApi();
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        response = await fetch(requestUrl, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch residents');
      }

      const residents = (await response.json()) as Account[];
      console.log('[fetchResidents] Received residents:', {
        count: residents.length,
        residentIds: residents.map((resident) => resident.id),
      });
      return residents;
    } catch (error) {
      console.error('[fetchResidents] Request failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch residents');
    }
  },
  {
    condition: (options, { getState }) => {
      const state = getState();
      const requestKey = `${options.accountId}:${options.propertyIds.join(',')}`;
      return Boolean(
        options.propertyIds.length > 0 &&
        (state.residents.status !== 'loading' &&
          (options.force === true || state.residents.requestKey !== requestKey))
      );
    },
  }
);

const residentsSlice = createSlice({
  name: 'residents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResidents.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.requestKey = `${action.meta.arg.accountId}:${action.meta.arg.propertyIds.join(',')}`;
      })
      .addCase(fetchResidents.fulfilled, (state, action: PayloadAction<Account[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchResidents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed to fetch residents';
      });
  },
});

export default residentsSlice.reducer;
