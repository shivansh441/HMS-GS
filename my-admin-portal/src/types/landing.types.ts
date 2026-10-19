export interface PublicProperty {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string;
  description: string;
  amenities: string[];
  images: string[];
  basePrice: number;
  rating: number;
  isAvailable: boolean;
}

export interface PublicUnit {
  id: number;
  unitNumber: string;
  category: string;
  type: string;
  capacity: number;
  price: number;
  isAvailable: boolean;
  features: string[];
}

export interface PublicReservationRequest {
  propertyId: number;
  guestName: string;
  mobile: string;
  email: string;
  customerType: 'HOTEL_GUEST' | 'HOSTEL_GUEST' | 'HOSTELER';
  requestedCategory: string;
  requestedType: string;
  requestedQuantity: number;
  numberOfAdults: number;
  numberOfChildren: number;
  expectedCheckIn: string;
  expectedCheckOut: string | null;
  purpose: string;
  specialRequests: string;
}