import type { ReactNode } from "react";

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <i className="fas fa-chart-line"></i>, path: '/' },
  { id: 'residents', label: 'Residents', icon: <i className="fas fa-users"></i>, path: '/residents' },
  { id: 'rooms', label: 'Rooms', icon: <i className="fas fa-door-open"></i>, path: '/rooms' },
  { id: 'finance', label: 'Fees & Finance', icon: <i className="fas fa-wallet"></i>, path: '/finance' },
  { id: 'employees', label: 'Employees', icon: <i className="fas fa-id-badge"></i>, path: '/employees' },
  { id: 'mess', label: 'Mess & Dining', icon: <i className="fas fa-utensils"></i>, path: '/mess' },
  { id: 'guests', label: 'Guests', icon: <i className="fas fa-user-clock"></i>, path: '/guests' },
  { id: 'admin', label: 'Hostels', icon: <i className="fas fa-building"></i>, path: '/admin' },
  { id: 'landing-page', label: 'Landing Page', icon: <i className="fas fa-globe"></i>, path: '/landing-page' },
];