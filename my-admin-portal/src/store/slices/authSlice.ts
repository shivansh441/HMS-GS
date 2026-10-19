import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthState } from "../../types/auth.types";
import { loginUserApi, getCurrentUserApi, refreshTokenApi } from "../../services/authService";

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  error: null,
  status: "idle",
  hasAttemptedUserFetch: false,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await loginUserApi(email, password);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Login failed");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (token: string, { getState, rejectWithValue }) => {
    // Prevent duplicate requests
    const state = getState() as any;
    if (state.auth.hasAttemptedUserFetch && state.auth.user) {
      return rejectWithValue('User already fetched');
    }

    try {
      try {
        const response = await getCurrentUserApi(token);
        return { ...response, accessToken: token };
      } catch {
        const refreshed = await refreshTokenApi();
        const response = await getCurrentUserApi(refreshed.accessToken);
        return { ...response, accessToken: refreshed.accessToken };
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch user info");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.error = null;
      state.status = "idle";
      state.hasAttemptedUserFetch = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    setAuthFromStorage: (state, action) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = "succeeded";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        state.hasAttemptedUserFetch = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.hasAttemptedUserFetch = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearAuthError, setAuthFromStorage, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;