export interface Meal {
  id: number;
  name: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
  date: string;
  items: string[];
  price: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealSubscription {
  id: number;
  accountId: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'ALL';
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  monthlyRate: number;
}

export interface MealAttendance {
  id: number;
  accountId: number;
  mealId: number;
  date: string;
  attended: boolean;
  recordedBy: number;
  createdAt: string;
}