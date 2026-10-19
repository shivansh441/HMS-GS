ALTER TABLE "Unit" RENAME COLUMN "pricePerNight" TO "defaultPricePerNight";
ALTER TABLE "Unit" RENAME COLUMN "recurringMonthlyRate" TO "defaultRecurringMonthlyRate";

ALTER TABLE "Unit"
  ALTER COLUMN "defaultPricePerNight" DROP DEFAULT,
  ALTER COLUMN "defaultPricePerNight" DROP NOT NULL;

ALTER TABLE "UnitAssignment"
  ADD COLUMN "agreedPricePerNight" DECIMAL(10,2),
  ADD COLUMN "agreedMonthlyRate" DECIMAL(10,2),
  ADD COLUMN "isCustomRate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "HostelWeeklyMenu" RENAME COLUMN "fullMessPrice" TO "suggestedMessPrice";