import { Prisma } from '@prisma/client';
/**
 * Strict Decimal Financial Sequencing Engine
 * Order of Operations: (Base - Discount) + Tax
 */
export declare const calculateLedgerMath: (baseInput: number | string, discountInput?: number | string, taxPercentageInput?: number | string) => {
    subTotal: Prisma.Decimal;
    adjustments: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
};
//# sourceMappingURL=finance.d.ts.map