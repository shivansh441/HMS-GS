import { Prisma } from '@prisma/client';
export const resolveAgreedRate = ({ billingStrategy, agreedPricePerNight, agreedMonthlyRate, }) => {
    const rate = billingStrategy === 'PER_NIGHT_STAY' ? agreedPricePerNight : agreedMonthlyRate;
    if (rate === null || rate === undefined || Number(rate) <= 0) {
        throw new Error('MISSING_AGREED_RATE');
    }
    return new Prisma.Decimal(rate);
};
export const calculateIsCustomRate = ({ billingStrategy, agreedPricePerNight, agreedMonthlyRate, defaultPricePerNight, defaultRecurringMonthlyRate, }) => {
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
//# sourceMappingURL=agreed-rate.js.map