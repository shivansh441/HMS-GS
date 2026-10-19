export type MealType = 'ALL' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
export type FoodOrderStatus = 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface HostelMenuItem {
  id?: number;
  dayOfWeek: number;
  mealType: MealType;
  name: string;
  description?: string | null;
  isAvailable?: boolean;
}

export interface HostelWeeklyMenu {
  id: number;
  propertyId: number;
  weekStart: string | null;
  suggestedMessPrice: number | string | null;
  isPermanent: boolean;
  isPublished: boolean;
  items: HostelMenuItem[];
}

export interface FoodMenuItem {
  id: number;
  propertyId: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  taxRate: number | string;
  isAvailable: boolean;
}

export interface FoodOrder {
  id: number;
  reservationId: number;
  accountId: number;
  status: FoodOrderStatus;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: number;
    itemNameSnapshot: string;
    unitPriceSnapshot: number | string;
    quantity: number;
    lineTotal: number | string;
  }>;
  account?: { firstName: string; lastName: string };
  reservation?: { id: number; guestName: string; status: string };
}