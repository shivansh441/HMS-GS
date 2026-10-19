import type { Account } from '../types/account.types';

interface ResidentFormValues extends Partial<Account> {
  propertyIds?: number[];
  unitId?: string;
  includeMess?: boolean;
}

export function validateResidentForm(values: ResidentFormValues, guestMode = false) {
  const errors: Record<string, string> = {};

  if (!values.firstName?.trim()) errors.firstName = 'First name is required';
  if (!values.lastName?.trim()) errors.lastName = 'Last name is required';
  const validCustomerType = guestMode
    ? values.customerType === 'HOSTEL_GUEST' || values.customerType === 'HOTEL_GUEST'
    : values.customerType === 'HOSTELER';
  if (values.role !== 'CUSTOMER' || !validCustomerType) {
    errors.customerType = guestMode ? 'Guests must use a valid guest subtype' : 'Residents must use the Hosteler subtype';
  }
  if (!values.email?.trim()) errors.email = 'Email is required';
  if (!values.phone?.trim()) errors.phone = 'Phone is required';
  if (!values.propertyIds?.length) errors.propertyIds = 'Property is required';
  if (values.unitId) {
    const accommodationRate = values.customerType === 'HOSTELER'
      ? values.agreedMonthlyRate
      : values.agreedPricePerNight;
    if (accommodationRate === undefined || accommodationRate === null || String(accommodationRate).trim() === '' || Number(accommodationRate) <= 0) {
      errors.agreedMonthlyRate = values.customerType === 'HOSTELER'
        ? 'A valid monthly accommodation rate is required'
        : 'A valid nightly accommodation rate is required';
    }
    if (values.customerType === 'HOSTELER' && values.includeMess === true && (values.agreedMonthlyMessRate === undefined || values.agreedMonthlyMessRate === null || String(values.agreedMonthlyMessRate).trim() === '' || Number(values.agreedMonthlyMessRate) <= 0)) {
      errors.agreedMonthlyMessRate = 'A valid monthly mess rate is required';
    }
  }

  return errors;
}
