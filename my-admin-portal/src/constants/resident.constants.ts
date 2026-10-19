import type { SelectOption } from '../components/atoms/Select';

export const RESIDENT_FILTER_OPTIONS: SelectOption[] = [
  { label: 'All residents', value: 'ALL' },
  { label: 'Hosteler', value: 'HOSTELER' },
  { label: 'Hostel Guest', value: 'HOSTEL_GUEST' },
  { label: 'Hotel Guest', value: 'HOTEL_GUEST' },
];

export const RESIDENT_SORT_OPTIONS: SelectOption[] = [
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
  { label: 'Newest first', value: 'created-desc' },
  { label: 'Oldest first', value: 'created-asc' },
];

export const RESIDENT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Hosteler', value: 'HOSTELER' },
  { label: 'Hostel Guest', value: 'HOSTEL_GUEST' },
  { label: 'Hotel Guest', value: 'HOTEL_GUEST' },
];

export const RESIDENT_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];
