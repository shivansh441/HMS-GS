export const HOTEL_CATEGORIES = [
  { label: "Classic", value: "CLASSIC" },
  { label: "Deluxe", value: "DELUXE" },
  { label: "Super Deluxe", value: "SUPER_DELUXE" },
  { label: "Executive", value: "EXECUTIVE" },
];

export const HOSTEL_CATEGORIES = [
  { label: "Single Room", value: "SINGLE_ROOM" },
  { label: "Double Room", value: "DOUBLE_ROOM" },
  { label: "Triple Room", value: "TRIPLE_ROOM" },
  { label: "Quadruple Room", value: "QUADRUPLE_ROOM" },
  { label: "Dormitory", value: "DORMITORY" },
];

export const HOTEL_FEATURE_PRESETS: Record<string, string[]> = {
  CLASSIC: ["WiFi", "TV", "Air Conditioning"],
  DELUXE: ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Balcony"],
  SUPER_DELUXE: ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Balcony", "Jacuzzi"],
  EXECUTIVE: ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Balcony", "Work Desk", "Room Service"],
};

export const HOSTEL_FEATURE_PRESETS: Record<string, string[]> = {
  SINGLE_ROOM: ["AC", "Private Bathroom", "WiFi", "Study Table"],
  DOUBLE_ROOM: ["AC", "Shared Bathroom", "WiFi", "Study Table"],
  TRIPLE_ROOM: ["NON-AC", "Shared Bathroom", "Laundry", "Hot Water"],
  QUADRUPLE_ROOM: ["NON-AC", "Shared Bathroom", "Laundry", "Hot Water"],
  DORMITORY: ["NON-AC", "Shared Bathroom", "Laundry", "Kitchen"],
};

export const HOSTEL_FEATURE_OPTIONS = [
  "AC",
  "NON-AC",
  "WiFi",
  "Private Bathroom",
  "Shared Bathroom",
  "Laundry",
  "Kitchen",
  "Study Table",
  "Cupboard",
  "Hot Water",
  "Breakfast",
];

export const HOTEL_FEATURE_OPTIONS = [
  "WiFi",
  "TV",
  "Air Conditioning",
  "Mini Fridge",
  "Balcony",
  "Work Desk",
  "Room Service",
  "Jacuzzi",
  "Kitchenette",
  "Safe",
];
