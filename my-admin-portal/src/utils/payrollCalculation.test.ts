import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayroll, MONTH_NAMES } from './payrollCalculation.js';

describe('Payroll Calculation Utility', () => {
  it('has 12 months correctly ordered', () => {
    assert.equal(MONTH_NAMES.length, 12);
    assert.equal(MONTH_NAMES[0], 'January');
    assert.equal(MONTH_NAMES[11], 'December');
  });

  it('calculates net pay correctly with zero deductions', () => {
    const result = calculatePayroll(35000, 0);
    assert.equal(result.baseSalary, 35000);
    assert.equal(result.deductions, 0);
    assert.equal(result.netPay, 35000);
  });

  it('deducts properly from base salary', () => {
    const result = calculatePayroll(35000, 5000);
    assert.equal(result.baseSalary, 35000);
    assert.equal(result.deductions, 5000);
    assert.equal(result.netPay, 30000);
  });

  it('prevents negative net pay if deductions exceed base salary', () => {
    const result = calculatePayroll(10000, 15000);
    assert.equal(result.baseSalary, 10000);
    assert.equal(result.deductions, 15000);
    assert.equal(result.netPay, 0);
  });

  it('handles null, undefined, or string inputs gracefully', () => {
    assert.equal(calculatePayroll(null).baseSalary, 0);
    assert.equal(calculatePayroll('24000', 2000).netPay, 22000);
  });
});
