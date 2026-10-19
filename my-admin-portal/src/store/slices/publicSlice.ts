import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/env.config';
import type { PublicProperty, PublicUnit, PublicReservationRequest } from '../../types/index';

interface PublicState {
  properties: PublicProperty[];
  selectedProperty: PublicProperty | null;
  units: PublicUnit[];
  loading: boolean;
  error: string | null;
}

const initialState: PublicState = {
  properties: [],
  selectedProperty: null,
  units: [],
  loading: false,
  error: null,
};

export const fetchPublicProperties = createAsyncThunk<PublicProperty[], void, { rejectValue: string }>(
  'public/fetchPublicProperties',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/properties`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch properties');
      }
      const payload = await res.json();
      return payload as PublicProperty[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch properties');
    }
  }
);

export const fetchPublicPropertyById = createAsyncThunk<PublicProperty, number, { rejectValue: string }>(
  'public/fetchPublicPropertyById',
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/properties/${propertyId}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch property details');
      }
      const payload = await res.json();
      return payload as PublicProperty;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch property details');
    }
  }
);

export const fetchPublicUnits = createAsyncThunk<PublicUnit[], number, { rejectValue: string }>(
  'public/fetchPublicUnits',
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/properties/${propertyId}/units`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch units');
      }
      const payload = await res.json();
      return payload as PublicUnit[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch units');
    }
  }
);

export const createPublicReservation = createAsyncThunk<any, PublicReservationRequest, { rejectValue: string }>(
  'public/createPublicReservation',
  async (reservationData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create reservation');
      }
      const payload = await res.json();
      return payload;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create reservation');
    }
  }
);

const publicSlice = createSlice({
  name: 'public',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<PublicProperty | null>) => {
      state.selectedProperty = action.payload;
    },
    clearUnits: (state) => {
      state.units = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicProperties.fulfilled, (state, action: PayloadAction<PublicProperty[]>) => {
        state.loading = false;
        state.properties = action.payload;
      })
      .addCase(fetchPublicProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? 'Failed to fetch properties';
      })
      .addCase(fetchPublicPropertyById.fulfilled, (state, action: PayloadAction<PublicProperty>) => {
        state.selectedProperty = action.payload;
      })
      .addCase(fetchPublicUnits.fulfilled, (state, action: PayloadAction<PublicUnit[]>) => {
        state.units = action.payload;
      })
      .addCase(createPublicReservation.rejected, (state, action) => {
        state.error = action.payload ?? action.error.message ?? 'Failed to create reservation';
      });
  },
});

export const { setSelectedProperty, clearUnits } = publicSlice.actions;
export default publicSlice.reducer;