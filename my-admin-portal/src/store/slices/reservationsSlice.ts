import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/env.config';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';
import type { Reservation } from '../../types/reservation.types';
import type { RootState } from '../store';

interface ReservationsState {
  items: Reservation[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ReservationsState = {
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

export const fetchReservations = createAsyncThunk<
  Reservation[],
  { propertyId?: number; propertyIds?: number[]; propertySubTypes?: string[]; status?: string },
  { state: RootState }
>(
  'reservations/fetchReservations',
  async ({ propertyId, propertyIds, propertySubTypes, status }, { dispatch, getState, rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.set('status', status);
      if (propertyIds?.length) queryParams.set('propertyIds', propertyIds.join(','));
      if (propertySubTypes?.length) queryParams.set('propertySubTypes', propertySubTypes.join(','));

      let url: string;
      if (propertyId) {
        url = `${API_BASE_URL}/api/properties/${propertyId}/reservations`;
      } else {
        url = `${API_BASE_URL}/api/reservations`;
      }

      const queryString = queryParams.toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;

      let response = await fetch(finalUrl, {
        headers: getAuthHeaders(getState()),
        credentials: 'include',
      });
      if (response.status === 401) {
        const refreshed = await refreshTokenApi();
        dispatch(updateAccessToken(refreshed.accessToken));
        response = await fetch(finalUrl, {
          headers: getAuthHeaders(getState()),
          credentials: 'include',
        });
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch reservations');
      }
      const payload = await response.json();
      return payload as Reservation[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch reservations');
    }
  }
);

export const updateReservationStatus = createAsyncThunk<Reservation, { propertyId: number; reservationId: number; status: string }, { state: RootState }>(
  'reservations/updateReservationStatus',
  async ({ propertyId, reservationId, status }, { getState, rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/reservations/${reservationId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(getState()),
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update reservation status');
      }
      const data = await res.json();
      return data as Reservation;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update reservation status');
    }
  }
);

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action: PayloadAction<Reservation[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch reservations';
      })
      .addCase(updateReservationStatus.fulfilled, (state, action: PayloadAction<Reservation>) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to update reservation status';
      });
  },
});

export default reservationsSlice.reducer;