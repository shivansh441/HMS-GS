// Static images for different room types based on UnitType and UnitCategory
// These are placeholder URLs - replace with actual hosted images

export const ROOM_IMAGES = {
  // BED type (Hostels)
  BED: {
    CLASSIC: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=800',
    DELUXE: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
    SUPER_DELUXE: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    EXECUTIVE: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    SINGLE_ROOM: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=800',
    DOUBLE_ROOM: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
    TRIPLE_ROOM: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    DORMITORY: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  },
  // ROOM type (Hotels)
  ROOM: {
    CLASSIC: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800',
    DELUXE: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    SUPER_DELUXE: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    EXECUTIVE: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
    SINGLE_ROOM: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800',
    DOUBLE_ROOM: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    TRIPLE_ROOM: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    DORMITORY: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
  },
  // SUITE type (Premium)
  SUITE: {
    CLASSIC: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    DELUXE: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
    SUPER_DELUXE: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    EXECUTIVE: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    SINGLE_ROOM: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
    DOUBLE_ROOM: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    TRIPLE_ROOM: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    DORMITORY: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
  },
};

export const getRoomImage = (type: string, category: string): string => {
  const typeKey = type.toUpperCase() as keyof typeof ROOM_IMAGES;
  const categoryKey = category.toUpperCase() as keyof typeof ROOM_IMAGES[keyof typeof ROOM_IMAGES];
  
  if (ROOM_IMAGES[typeKey] && ROOM_IMAGES[typeKey][categoryKey]) {
    return ROOM_IMAGES[typeKey][categoryKey];
  }
  
  // Fallback to BED CLASSIC if not found
  return ROOM_IMAGES.BED.CLASSIC;
};

export const PROPERTY_IMAGES = {
  HOSTEL_BOYS: [
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=2071',
  ],
  HOSTEL_GIRLS: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=2069',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069',
  ],
  HOSTEL_COED: [
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=2071',
  ],
  HOTEL: [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=2070',
  ],
  CO_LIVING: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=2071',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069',
  ],
};

export const getPropertyImage = (type: string): string => {
  const images = PROPERTY_IMAGES[type as keyof typeof PROPERTY_IMAGES];
  if (images && images.length > 0) {
    return images[Math.floor(Math.random() * images.length)];
  }
  return PROPERTY_IMAGES.HOTEL[0];
};