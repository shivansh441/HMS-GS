export interface FinancialRecord {
  id: number;
  propertyId?: number;
  amount: number;
  type: string;
  description?: string;
  date: string;
}

export interface PayrollRecord {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  deductions: number;
  netPay: number;
  period: string;
}
