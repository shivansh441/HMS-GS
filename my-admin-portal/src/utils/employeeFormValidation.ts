import type { Account } from '../types/account.types';

export function validateAccountForm(values: Partial<Account>) {
  const errors: Record<string, string> = {};

  if (!values.firstName?.trim()) errors.firstName = 'First name is required';
  if (!values.lastName?.trim()) errors.lastName = 'Last name is required';
  if (!values.email?.trim()) errors.email = 'Email is required';
  if (!values.phone?.trim()) errors.phone = 'Phone is required';
  if (!values.joinDate) errors.joinDate = 'Join date is required';
  if (values.baseSalary !== undefined && values.baseSalary !== null && values.baseSalary !== '' && Number(values.baseSalary) <= 0) {
    errors.baseSalary = 'Base salary must be greater than 0';
  }
  if (values.isActive === false && !values.leftDate) errors.leftDate = 'Left date is required when inactive';

  return errors;
}
