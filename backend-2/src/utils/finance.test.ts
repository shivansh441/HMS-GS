import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateLedgerMath } from './finance.js';

describe('calculateLedgerMath', () => {
  it('calculates standard base amount with zero discount and zero tax', () => {
    const result = calculateLedgerMath(1000, 0, 0);
    assert.equal(result.subTotal.toNumber(), 1000);
    assert.equal(result.adjustments.toNumber(), 0);
    assert.equal(result.taxAmount.toNumber(), 0);
    assert.equal(result.totalAmount.toNumber(), 1000);
  });

  it('applies discount correctly (Base - Discount)', () => {
    const result = calculateLedgerMath(1000, 200, 0);
    assert.equal(result.subTotal.toNumber(), 800);
    assert.equal(result.adjustments.toNumber(), 200);
    assert.equal(result.totalAmount.toNumber(), 800);
  });

  it('caps discount at base to prevent negative subtotals', () => {
    const result = calculateLedgerMath(500, 700, 0);
    assert.equal(result.subTotal.toNumber(), 0);
    assert.equal(result.adjustments.toNumber(), 500);
    assert.equal(result.totalAmount.toNumber(), 0);
  });

  it('calculates tax on subtotal (Base - Discount) + Tax', () => {
    // 1000 base, 200 discount = 800 subtotal. 18% tax on 800 = 144. Total = 944.
    const result = calculateLedgerMath(1000, 200, 18);
    assert.equal(result.subTotal.toNumber(), 800);
    assert.equal(result.taxAmount.toNumber(), 144);
    assert.equal(result.totalAmount.toNumber(), 944);
  });

  it('handles decimal precision properly', () => {
    // 99.99 base, 10 discount = 89.99 subtotal. 12% tax = 10.7988 -> 10.80. Total = 100.79.
    const result = calculateLedgerMath(99.99, 10, 12);
    assert.equal(result.subTotal.toString(), '89.99');
    assert.equal(result.taxAmount.toString(), '10.8');
    assert.equal(result.totalAmount.toString(), '100.79');
  });
});
