import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = 'http://localhost:5000/api';

export interface Property {
  id: number;
  name: string;
  type: 'HOSTEL_BOYS' | 'HOSTEL_GIRLS' | 'HOSTEL_COED' | 'HOTEL' | 'CO_LIVING';
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  contactEmail?: string;
  facilities: string[];
  currency: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius: number;
  floors: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: number;
  unitNumber: string;
  floor: number;
  type: 'BED' | 'ROOM' | 'SUITE';
  category: 'CLASSIC' | 'DELUXE' | 'SUPER_DELUXE' | 'EXECUTIVE' | 'SINGLE_ROOM' | 'DOUBLE_ROOM' | 'TRIPLE_ROOM' | 'DORMITORY';
  capacity: number;
  pricePerNight: number;
  recurringMonthlyRate?: number;
  features: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';
}

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  currentUnits: Unit[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  fetchPropertyById: (id: number) => Promise<void>;
  fetchUnitsByPropertyId: (propertyId: number) => Promise<void>;
  clearError: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      properties: [],
      currentProperty: null,
      currentUnits: [],
      loading: false,
      error: null,

      fetchProperties: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/public/properties`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch properties');
          }

          set({ properties: data, loading: false });
        } catch (err: any) {
          set({ 
            error: err?.message || 'Failed to fetch properties. Please try again.', 
            loading: false 
          });
          throw err;
        }
      },

      fetchPropertyById: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/public/properties/${id}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch property');
          }

          set({ currentProperty: data, loading: false });
        } catch (err: any) {
          set({ 
            error: err?.message || 'Failed to fetch property. Please try again.', 
            loading: false 
          });
          throw err;
        }
      },

      fetchUnitsByPropertyId: async (propertyId: number) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/public/properties/${propertyId}/units`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch units');
          }

          set({ currentUnits: data, loading: false });
        } catch (err: any) {
          set({ 
            error: err?.message || 'Failed to fetch units. Please try again.', 
            loading: false 
          });
          throw err;
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'property-storage',
      partialize: (state) => ({ properties: state.properties }),
    }
  )
);