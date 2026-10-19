import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Property } from '../../types/property.types';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from './authSlice';
import {
  fetchPropertiesApi,
  createPropertyApi,
  updatePropertyApi,
  deactivatePropertyApi,
} from '../../services/propertyService';

interface PropertiesState {
  list: Property[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedPropertyId: string | null;
}

const initialState: PropertiesState = {
  list: [],
  status: 'idle',
  error: null,
  selectedPropertyId: null,
};

export const fetchProperties = createAsyncThunk<Property[], { force?: boolean } | void, { rejectValue: string }>(
  'properties/fetchProperties',
  async (_options, { dispatch, getState, rejectWithValue }) => {
    const state: any = getState();
    
    // Only fetch if user is authenticated and validated
    if (!state.auth?.isAuthenticated || !state.auth?.user) {
      console.log('[fetchProperties] User not authenticated or validated, skipping fetch');
      return rejectWithValue('User not authenticated');
    }

    console.log('[fetchProperties] Fetching properties for user:', state.auth.user);
    try {
      let token = state.auth?.accessToken;
      let result: Property[];
      try {
        result = await fetchPropertiesApi(token);
      } catch (error) {
        if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 401) {
          throw error;
        }
        const refreshed = await refreshTokenApi();
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        result = await fetchPropertiesApi(token);
      }
      console.log('[fetchProperties] Properties fetched successfully:', {
        count: result.length,
        properties: result.map((property) => ({ id: property.id, name: property.name, type: property.type })),
      });
      return result;
    } catch (error) {
      console.error('[fetchProperties] Error fetching properties:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load properties');
    }
  },
  {
    condition: (options, { getState }) => {
      const state: any = getState();
      const propertiesState = state.properties;
      const force = Boolean(options && 'force' in options && options.force);

      return Boolean(
        state.auth?.isAuthenticated &&
        state.auth?.user &&
        (force || (propertiesState?.status !== 'loading' && propertiesState?.status !== 'succeeded'))
      );
    },
  }
);

export const createProperty = createAsyncThunk<Property, Record<string, any>, { rejectValue: string }>(
  'properties/createProperty',
  async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      let token = state.auth?.accessToken;
      try {
        return await createPropertyApi(payload, token);
      } catch (error) {
        if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 401) throw error;
        const refreshed = await refreshTokenApi();
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        return await createPropertyApi(payload, token);
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create property');
    }
  }
);

export const editProperty = createAsyncThunk<Property, { propertyId: number; payload: Record<string, any> }, { rejectValue: string }>(
  'properties/editProperty',
  async ({ propertyId, payload }, { dispatch, getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      let token = state.auth?.accessToken;
      try {
        return await updatePropertyApi(propertyId, payload, token);
      } catch (error) {
        if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 401) throw error;
        const refreshed = await refreshTokenApi();
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        return await updatePropertyApi(propertyId, payload, token);
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update property');
    }
  }
);

export const deactivateProperty = createAsyncThunk<number, { propertyId: number; password: string }, { rejectValue: string }>(
  'properties/deactivateProperty',
  async ({ propertyId, password }, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const token = state.auth?.accessToken;
      await deactivatePropertyApi(propertyId, password, token);
      return propertyId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to deactivate property');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSelectedPropertyId: (state, action: PayloadAction<string | null>) => {
      state.selectedPropertyId = action.payload;
    },
    resetProperties: (state) => {
      state.list = [];
      state.status = 'idle';
      state.error = null;
      state.selectedPropertyId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action: PayloadAction<Property[]>) => {
        state.status = 'succeeded';
        state.list = action.payload;
        const selectedPropertyStillExists = action.payload.some(
          (property) => String(property.id) === String(state.selectedPropertyId)
        );

        if (state.selectedPropertyId && !selectedPropertyStillExists) {
          state.selectedPropertyId = null;
        } else if (action.payload.length === 0) {
          state.selectedPropertyId = null;
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed to load properties';
      })
      .addCase(createProperty.fulfilled, (state, action: PayloadAction<Property>) => {
        state.status = 'succeeded';
        state.list.unshift(action.payload);
        state.selectedPropertyId = String(action.payload.id);
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to create property';
      })
      .addCase(editProperty.fulfilled, (state, action: PayloadAction<Property>) => {
        state.status = 'succeeded';
        const index = state.list.findIndex((property) => property.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        } else {
          state.list.unshift(action.payload);
        }
      })
      .addCase(editProperty.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to update property';
      })
      .addCase(deactivateProperty.fulfilled, (state, action: PayloadAction<number>) => {
        state.status = 'succeeded';
        state.list = state.list.filter((property) => property.id !== action.payload);
        if (state.selectedPropertyId === String(action.payload)) {
          state.selectedPropertyId = state.list[0]?.id ? String(state.list[0].id) : null;
        }
      })
      .addCase(deactivateProperty.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed to deactivate property';
      });
  },
});

export const { setSelectedPropertyId, resetProperties } = propertiesSlice.actions;
export default propertiesSlice.reducer;
