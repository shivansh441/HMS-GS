import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { fetchCurrentUser, logout, updateAccessToken } from "./store/slices/authSlice";
import { fetchProperties } from "./store/slices/propertiesSlice";
import { refreshTokenApi } from "./services/authService";
import App from "./App";
import "./index.css";
// Apply persisted or system theme asap to avoid FOUC
import { getInitialTheme, applyTheme } from "./utils/theme";

applyTheme(getInitialTheme() === "dark");

// Fetch current user info on app load if we have a token but no user data
const state = store.getState();
console.log('[main.tsx] Initial auth state:', {
  isAuthenticated: state.auth?.isAuthenticated,
  hasUser: !!state.auth?.user,
  hasToken: !!state.auth?.accessToken,
  user: state.auth?.user,
  propertiesStatus: state.properties?.status
});

if (state.auth?.accessToken && !state.auth?.user) {
  console.log('[main.tsx] Fetching current user...');
  store.dispatch(fetchCurrentUser(state.auth.accessToken))
    .then((result) => {
      console.log('[main.tsx] User fetched successfully:', result);
      // After user is validated, fetch properties
      const newState = store.getState();
      if (newState.auth?.isAuthenticated && newState.auth?.user) {
        console.log('[main.tsx] User validated, fetching properties...');
        store.dispatch(fetchProperties());
      }
    })
    .catch((error) => {
      console.error('[main.tsx] Error fetching user:', error);
    });
} else if (state.auth?.isAuthenticated && state.auth?.user) {
  // Refresh persisted sessions before protected data requests use the stored token.
  console.log('[main.tsx] Refreshing persisted session...');
  void refreshTokenApi()
    .then((refreshed) => {
      store.dispatch(updateAccessToken(refreshed.accessToken));
      return store.dispatch(fetchProperties()).unwrap();
    })
    .catch((error) => {
      console.error('[main.tsx] Persisted session refresh failed:', error);
      store.dispatch(logout());
    });
} else {
  console.log('[main.tsx] No authentication found, skipping property fetch');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);