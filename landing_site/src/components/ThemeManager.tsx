// src/components/ThemeManager.tsx
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ThemeMode } from '../types';

export const ThemeManager = () => {
  // Subscribe specifically to the theme state
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === ThemeMode.DARK) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  // This component doesn't render any UI
  return null; 
};