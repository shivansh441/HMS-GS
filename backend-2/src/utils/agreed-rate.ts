import { Prisma } from '@prisma/client';

type RateValue = Prisma.Decimal | number | string | null | undefined;

type AgreedRateInput = {
  billingStrategy: 'PER_NIGHT_STAY' | 'RECURRING_MONTHLY';
  agreedPricePerNight: RateValue;
  agreedMonthlyRate: RateValue;
  defaultPricePerNight: RateValue;
  defaultRecurringMonthlyRate: RateValue;
};

export const resolveAgreedRate = ({
  billingStrategy,
  agreedPricePerNight,
  agreedMonthlyRate,
}: AgreedRateInput): Prisma.Decimal => {
  const rate = billingStrategy === 'PER_NIGHT_STAY' ? agreedPricePerNight : agreedMonthlyRate;
  if (rate === null || rate === undefined || Number(rate) <= 0) {
    throw new Error('MISSING_AGREED_RATE');
  }
  return new Prisma.Decimal(rate);
};

export const calculateIsCustomRate = ({
  billingStrategy,
  agreedPricePerNight,
  agreedMonthlyRate,
  defaultPricePerNight,
  defaultRecurringMonthlyRate,
}: AgreedRateInput): boolean => {
  const agreedRate = resolveAgreedRate({
    billingStrategy,
    agreedPricePerNight,
    agreedMonthlyRate,
    defaultPricePerNight,
    defaultRecurringMonthlyRate,
  });
  const defaultRate = billingStrategy === 'PER_NIGHT_STAY'
    ? defaultPricePerNight
    : defaultRecurringMonthlyRate;

  return defaultRate === null || defaultRate === undefined || !agreedRate.eq(defaultRate);
};
