import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAgreedRate, calculateIsCustomRate } from './agreed-rate.js';

describe('Agreed Rate Resolver & Custom Rate Detection', () => {
  it('resolves agreedPricePerNight for PER_NIGHT_STAY strategy', () => {
    const rate = resolveAgreedRate({
      billingStrategy: 'PER_NIGHT_STAY',
      agreedPricePerNight: 1200,
      agreedMonthlyRate: 15000,
      defaultPricePerNight: 1000,
      defaultRecurringMonthlyRate: 14000,
    });
    assert.equal(rate.toNumber(), 1200);
  });

  it('resolves agreedMonthlyRate for RECURRING_MONTHLY strategy', () => {
    const rate = resolveAgreedRate({
      billingStrategy: 'RECURRING_MONTHLY',
      agreedPricePerNight: 1200,
      agreedMonthlyRate: 8500,
      defaultPricePerNight: 1000,
      defaultRecurringMonthlyRate: 9000,
    });
    assert.equal(rate.toNumber(), 8500);
  });

  it('throws MISSING_AGREED_RATE when rate is missing, null, or zero', () => {
    assert.throws(
      () =>
        resolveAgreedRate({
          billingStrategy: 'PER_NIGHT_STAY',
          agreedPricePerNight: null,
          agreedMonthlyRate: 5000,
          defaultPricePerNight: 1000,
          defaultRecurringMonthlyRate: 5000,
        }),
      /MISSING_AGREED_RATE/
    );

    assert.throws(
      () =>
        resolveAgreedRate({
          billingStrategy: 'RECURRING_MONTHLY',
          agreedPricePerNight: 1000,
          agreedMonthlyRate: 0,
          defaultPricePerNight: 1000,
          defaultRecurringMonthlyRate: 5000,
        }),
      /MISSING_AGREED_RATE/
    );
  });

  it('detects custom rate when agreed rate differs from default', () => {
    const isCustom = calculateIsCustomRate({
      billingStrategy: 'RECURRING_MONTHLY',
      agreedPricePerNight: null,
      agreedMonthlyRate: 7500,
      defaultPricePerNight: null,
      defaultRecurringMonthlyRate: 8000,
    });
    assert.equal(isCustom, true);
  });

  it('detects standard rate when agreed rate matches default', () => {
    const isCustom = calculateIsCustomRate({
      billingStrategy: 'RECURRING_MONTHLY',
      agreedPricePerNight: null,
      agreedMonthlyRate: 8000,
      defaultPricePerNight: null,
      defaultRecurringMonthlyRate: 8000,
    });
    assert.equal(isCustom, false);
  });
});
