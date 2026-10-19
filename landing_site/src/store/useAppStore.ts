import { create } from 'zustand';
import { ThemeMode, User } from '../types';

interface AppStore {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: ThemeMode.LIGHT,
  setTheme: (theme) => set({ theme }),
  user: null,
  setUser: (user) => set({ user }),
}));