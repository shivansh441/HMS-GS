import { API_BASE_URL } from '../constants/api.constants';

const authHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const fetchWorkingDaysApi = async (period: string, propertyId?: number, token?: string | null) => {
  const query = new URLSearchParams({ period });
  if (propertyId) query.set('propertyId', String(propertyId));

  const response = await fetch(`${API_BASE_URL}/hr/working-days?${query.toString()}`, {
    headers: authHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch working day records.');
  }
  const result = await response.json();
  return result.data ?? [];
};

export const saveWorkingDaysApi = async (
  data: {
    accountId: number;
    propertyId?: number;
    payrollPeriod: string;
    workingDays: number;
    notes?: string;
  },
  token?: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/hr/working-days`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record working days.');
  }
  const result = await response.json();
  return result.data;
};

export const fetchPayrollsApi = async (period: string, propertyId?: number, token?: string | null) => {
  const query = new URLSearchParams({ period });
  if (propertyId) query.set('propertyId', String(propertyId));

  const response = await fetch(`${API_BASE_URL}/hr/payrolls?${query.toString()}`, {
    headers: authHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch payroll records.');
  }
  const result = await response.json();
  return result.data ?? [];
};

export const processPayrollApi = async (
  data: {
    propertyId?: number;
    payrollPeriod: string;
    accountId?: number;
  },
  token?: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/hr/payrolls/process`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to process payroll.');
  }
  const result = await response.json();
  return result.data ?? [];
};

export const recordPayrollPaymentApi = async (
  payrollId: number,
  data: {
    paymentMethod: string;
    referenceId?: string;
    notes?: string;
  },
  token?: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/hr/payrolls/${payrollId}/payment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record payroll payment.');
  }
  const result = await response.json();
  return result.data;
};

export const fetchSalaryHistoryApi = async (accountId: number, token?: string | null) => {
  const response = await fetch(`${API_BASE_URL}/hr/accounts/${accountId}/salaries`, {
    headers: authHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch salary revision history.');
  }
  const result = await response.json();
  return result.data ?? [];
};

export const updateSalaryApi = async (
  accountId: number,
  data: {
    newSalary: number;
    effectiveDate?: string;
    reason?: string;
  },
  token?: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/hr/accounts/${accountId}/salaries`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update salary.');
  }
  const result = await response.json();
  return result.data;
};
