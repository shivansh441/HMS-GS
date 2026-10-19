export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'resident' | 'STAFF' | 'MANAGER' | 'SUPER_ADMIN' | 'CUSTOMER';
}

export interface AppContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}
