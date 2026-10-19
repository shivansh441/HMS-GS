import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getGuestCards } from '../../services/guestCardService';
import type { GuestCard } from '../../types/guestCard.types';
import type { RootState } from '../store';

interface GuestCardsState {
  byProperty: Record<number, GuestCard[]>;
  statusByProperty: Record<number, 'idle' | 'loading' | 'succeeded' | 'failed'>;
  errorByProperty: Record<number, string | null>;
}

const initialState: GuestCardsState = { byProperty: {}, statusByProperty: {}, errorByProperty: {} };

export const fetchGuestCards = createAsyncThunk<GuestCard[], number, { state: RootState; rejectValue: string }>(
  'guestCards/fetchGuestCards',
  async (propertyId, { getState, rejectWithValue }) => {
    const state = getState();
    if (!state.auth?.isAuthenticated || !state.auth.user || !state.auth.accessToken) return rejectWithValue('Authentication required');
    try {
      return await getGuestCards(propertyId, state.auth.accessToken);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch guest cards');
    }
  },
);

const guestCardsSlice = createSlice({
  name: 'guestCards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestCards.pending, (state, action) => {
        state.statusByProperty[action.meta.arg] = 'loading';
        state.errorByProperty[action.meta.arg] = null;
      })
      .addCase(fetchGuestCards.fulfilled, (state, action: PayloadAction<GuestCard[], string, { arg: number }>) => {
        state.statusByProperty[action.meta.arg] = 'succeeded';
        state.byProperty[action.meta.arg] = action.payload;
      })
      .addCase(fetchGuestCards.rejected, (state, action) => {
        state.statusByProperty[action.meta.arg] = 'failed';
        state.errorByProperty[action.meta.arg] = action.payload ?? action.error.message ?? 'Failed to fetch guest cards';
      });
  },
});

export const selectGuestCardsByProperty = (state: RootState, propertyId: number) => state.guestCards.byProperty[propertyId] ?? [];

export const selectGuestCardsByPropertyMemoized = (state: RootState, propertyId: number) =>
  state.guestCards.byProperty[propertyId] ?? [];

export default guestCardsSlice.reducer;