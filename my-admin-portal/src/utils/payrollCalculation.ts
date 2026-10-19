export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function calculatePayroll(baseSalary: number | string | null, deductions = 0) {
  const base = Number(baseSalary) || 0;
  const net = Math.max(0, base - deductions);
  return { baseSalary: base, deductions, netPay: net };
}
