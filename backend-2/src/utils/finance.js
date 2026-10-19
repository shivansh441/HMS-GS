import { Prisma } from '@prisma/client';
/**
 * Strict Decimal Financial Sequencing Engine
 * Order of Operations: (Base - Discount) + Tax
 */
export const calculateLedgerMath = (baseInput, discountInput = 0, taxPercentageInput = 0) => {
    const base = new Prisma.Decimal(baseInput);
    const discount = new Prisma.Decimal(discountInput);
    const taxPct = new Prisma.Decimal(taxPercentageInput);
    // 1. Prevent negative sub-totals if discount exceeds base
    const discountToApply = Prisma.Decimal.min(base, discount);
    // 2. Subtotal = Base - Discount
    const subTotal = base.minus(discountToApply);
    // 3. Tax = Subtotal * (Tax% / 100)
    const taxMultiplier = taxPct.dividedBy(100);
    const taxAmount = subTotal.times(taxMultiplier).toDecimalPlaces(2);
    // 4. Total = Subtotal + Tax
    const totalAmount = subTotal.plus(taxAmount).toDecimalPlaces(2);
    return {
        subTotal, // Prisma.Decimal
        adjustments: discountToApply, // Prisma.Decimal
        taxAmount, // Prisma.Decimal
        totalAmount // Prisma.Decimal
    };
};
//# sourceMappingURL=finance.js.map