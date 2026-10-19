import { BillingStrategy, Prisma } from '@prisma/client';
import { prisma } from '../src/utils/prisma.js';

if (process.env.NODE_ENV !== 'development') {
  console.error('[BACKFILL] Refusing to run outside development. Set NODE_ENV=development explicitly.');
  process.exitCode = 1;
} else {
  const assignments = await prisma.unitAssignment.findMany({
    include: {
      unit: {
        select: {
          defaultPricePerNight: true,
          defaultRecurringMonthlyRate: true,
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  let missingRate = 0;

  try {
    for (const assignment of assignments) {
      const rate = assignment.billingStrategy === BillingStrategy.PER_NIGHT_STAY
        ? assignment.unit.defaultPricePerNight
        : assignment.unit.defaultRecurringMonthlyRate;

      if (rate === null || rate === undefined) {
        skipped += 1;
        if (assignment.isActive) missingRate += 1;
        console.warn(`[BACKFILL] Skipped assignment ${assignment.id}: missing ${assignment.billingStrategy === BillingStrategy.PER_NIGHT_STAY ? 'defaultPricePerNight' : 'defaultRecurringMonthlyRate'}.`);
        continue;
      }

      await prisma.unitAssignment.update({
        where: { id: assignment.id },
        data: assignment.billingStrategy === BillingStrategy.PER_NIGHT_STAY
          ? {
              agreedPricePerNight: new Prisma.Decimal(rate),
              agreedMonthlyRate: null,
              isCustomRate: false,
            }
          : {
              agreedPricePerNight: null,
              agreedMonthlyRate: new Prisma.Decimal(rate),
              isCustomRate: false,
            },
      });
      updated += 1;
    }

    console.log(`[BACKFILL] Updated: ${updated}; skipped: ${skipped}; active assignments missing defaults: ${missingRate}.`);
  } finally {
    await prisma.$disconnect();
  }
}
