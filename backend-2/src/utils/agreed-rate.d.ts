import { Prisma } from '@prisma/client';
type RateValue = Prisma.Decimal | number | string | null | undefined;
type AgreedRateInput = {
    billingStrategy: 'PER_NIGHT_STAY' | 'RECURRING_MONTHLY';
    agreedPricePerNight: RateValue;
    agreedMonthlyRate: RateValue;
    defaultPricePerNight: RateValue;
    defaultRecurringMonthlyRate: RateValue;
};
export declare const resolveAgreedRate: ({ billingStrategy, agreedPricePerNight, agreedMonthlyRate, }: AgreedRateInput) => Prisma.Decimal;
export declare const calculateIsCustomRate: ({ billingStrategy, agreedPricePerNight, agreedMonthlyRate, defaultPricePerNight, defaultRecurringMonthlyRate, }: AgreedRateInput) => boolean;
export {};
//# sourceMappingURL=agreed-rate.d.ts.map