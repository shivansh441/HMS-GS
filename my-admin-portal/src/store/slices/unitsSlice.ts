import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchUnitsApi } from '../../services/unitService';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';
import type { Unit } from '../../types/unit.types';
import type { RootState } from '../store';

type UnitRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface UnitsState {
  items: Record<number, Unit[]>; // propertyId -> units
  statusByProperty: Record<number, UnitRequestStatus>;
  error: string | null;
}

const initialState: UnitsState = {
  items: {},
  statusByProperty: {},
  error: null,
};

export const fetchUnits = createAsyncThunk<
  { units: Unit[]; propertyId: number },
  { propertyId: number; force?: boolean },
  { state: RootState; rejectValue: string }
>(
  'units/fetchUnits',
  async ({ propertyId, force }, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      if (!state.auth?.isAuthenticated || !state.auth.user || !state.auth.accessToken) {
        console.warn('[fetchUnits] Skipped: authentication is missing', { propertyId });
        return rejectWithValue('Authentication required');
      }
      let token = state.auth.accessToken;
      console.log('[fetchUnits] Requesting units:', {
        accountId: state.auth.user.id,
        role: state.auth.user.role,
        propertyId,
        force: Boolean(force),
      });
      let units: Unit[];
      try {
        units = await fetchUnitsApi(propertyId, token);
      } catch (error) {
        const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
        if (status !== 401) throw error;

        console.debug('[fetchUnits] Access token expired; refreshing token', { propertyId });
        const refreshed = await refreshTokenApi();
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        units = await fetchUnitsApi(propertyId, token);
      }
      console.log('[fetchUnits] Received units:', {
        propertyId,
        count: units.length,
        unitIds: units.map((unit) => unit.id),
      });
      return { units, propertyId };
    } catch (error) {
      console.error('[fetchUnits] Request failed:', { propertyId, error });
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load units');
    }
  },
  {
    condition: ({ propertyId, force }, { getState }) => {
      const status = getState().units.statusByProperty[propertyId] ?? 'idle';
      return status !== 'loading' && (force === true || status !== 'succeeded');
    },
  }
);

const unitsSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state, action) => {
        state.error = null;
        state.statusByProperty[action.meta.arg.propertyId] = 'loading';
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        const { propertyId, units } = action.payload;
        state.items[propertyId] = units;
        state.statusByProperty[propertyId] = 'succeeded';
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        const propertyId = action.meta.arg.propertyId;
        state.statusByProperty[propertyId] = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Failed to load units';
      });
  },
});

export default unitsSlice.reducer;