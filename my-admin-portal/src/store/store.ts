import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import accountsReducer from "./slices/accountsSlice";
import propertiesReducer from "./slices/propertiesSlice";
import reservationsReducer from "./slices/reservationsSlice";
import hostelReducer from "./slices/hostelSlice";
import publicReducer from "./slices/publicSlice";
import unitsReducer from "./slices/unitsSlice";
import residentsReducer from "./slices/residentsSlice";
import guestCardsReducer from "./slices/guestCardsSlice";

function loadPersistedAuth() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

const preloadedAuth = loadPersistedAuth();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountsReducer,
    properties: propertiesReducer,
    reservations: reservationsReducer,
    hostelReservations: hostelReducer,
    public: publicReducer,
    units: unitsReducer,
    residents: residentsReducer,
    guestCards: guestCardsReducer,
  },
  preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
});

// persist on changes
if (typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const state = store.getState();
      window.localStorage.setItem("auth", JSON.stringify(state.auth));
    } catch {}
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;