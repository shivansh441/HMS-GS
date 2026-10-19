import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/env.config';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';
import type { Reservation } from '../../types/reservation.types';
import type { RootState } from '../store';

interface HostelReservationsState {
  items: Reservation[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: HostelReservationsState = {
  items: [],
  status: 'idle',
  error: null,
};

const getAuthHeaders = (state: RootState) => {
  const token = state.auth?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchHostelReservations = createAsyncThunk<
  Reservation[],
  { propertyIds?: number[]; propertySubTypes?: string[]; status?: string },
  { state: RootState }
>(
  'hostelReservations/fetchHostelReservations',
  async ({ propertyIds, propertySubTypes, status }, { dispatch, getState, rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (propertyIds?.length) params.set('propertyIds', propertyIds.join(','));
      if (propertySubTypes?.length) params.set('propertySubTypes', propertySubTypes.join(','));

      const url = `${API_BASE_URL}/api/reservations${params.toString() ? `?${params.toString()}` : ''}`;
      let response = await fetch(url, {
        headers: getAuthHeaders(getState()),
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshed = await refreshTokenApi();
        dispatch(updateAccessToken(refreshed.accessToken));
        response = await fetch(url, {
          headers: getAuthHeaders(getState()),
          credentials: 'include',
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch hostel reservations');
      }

      const payload = await response.json();
      return payload as Reservation[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch hostel reservations');
    }
  }
);

const hostelSlice = createSlice({
  name: 'hostelReservations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHostelReservations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHostelReservations.fulfilled, (state, action: PayloadAction<Reservation[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchHostelReservations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch hostel reservations';
      });
  },
});

export default hostelSlice.reducer;
