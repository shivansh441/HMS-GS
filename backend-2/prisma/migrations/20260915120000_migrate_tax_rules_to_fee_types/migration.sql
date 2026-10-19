-- Convert legacy TaxRule.name/chargeType values into reusable FeeType records.
CREATE TABLE "FeeType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeeType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeType_name_key" ON "FeeType"("name");
CREATE INDEX "FeeType_isActive_idx" ON "FeeType"("isActive");

INSERT INTO "FeeType" ("name", "isSystemDefined", "isActive", "updatedAt")
SELECT DISTINCT ON ("feeName")
    "feeName",
    false,
    true,
    CURRENT_TIMESTAMP
FROM (
    SELECT
        "id",
        COALESCE(NULLIF(BTRIM("name"), ''), INITCAP(REPLACE("chargeType"::text, '_', ' '))) AS "feeName"
    FROM "TaxRule"
) AS legacy_fee_names
WHERE "feeName" IS NOT NULL
ORDER BY "feeName", "id";

ALTER TABLE "TaxRule" ADD COLUMN "feeTypeId" INTEGER;

UPDATE "TaxRule" AS tax_rule
SET "feeTypeId" = fee_type."id"
FROM "FeeType" AS fee_type
WHERE fee_type."name" = COALESCE(
    NULLIF(BTRIM(tax_rule."name"), ''),
    INITCAP(REPLACE(tax_rule."chargeType"::text, '_', ' '))
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "TaxRule" WHERE "feeTypeId" IS NULL) THEN
    RAISE EXCEPTION 'TaxRule migration could not map every legacy rule to a FeeType';
  END IF;

  IF EXISTS (
    SELECT "propertyId", "feeTypeId"
    FROM "TaxRule"
    GROUP BY "propertyId", "feeTypeId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'TaxRule migration found duplicate property and fee type mappings';
  END IF;
END $$;

ALTER TABLE "TaxRule" ALTER COLUMN "feeTypeId" SET NOT NULL;
ALTER TABLE "TaxRule" DROP COLUMN "chargeType";
ALTER TABLE "TaxRule" DROP COLUMN "name";
DROP INDEX IF EXISTS "TaxRule_propertyId_chargeType_isActive_idx";

CREATE UNIQUE INDEX "TaxRule_propertyId_feeTypeId_key"
  ON "TaxRule"("propertyId", "feeTypeId");

CREATE INDEX IF NOT EXISTS "TaxRule_propertyId_isActive_idx"
  ON "TaxRule"("propertyId", "isActive");

ALTER TABLE "TaxRule"
  ADD CONSTRAINT "TaxRule_feeTypeId_fkey"
  FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TYPE IF EXISTS "TaxChargeType";

ALTER TABLE "FinancialLedger" DROP CONSTRAINT IF EXISTS "FinancialLedger_reservationId_fkey";
ALTER TABLE "FinancialLedger" ALTER COLUMN "reservationId" DROP NOT NULL;
ALTER TABLE "FinancialLedger"
  ADD CONSTRAINT "FinancialLedger_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "ReservationRequest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FoodOrder" DROP CONSTRAINT IF EXISTS "FoodOrder_reservationId_fkey";
ALTER TABLE "FoodOrder" ALTER COLUMN "reservationId" DROP NOT NULL;
ALTER TABLE "FoodOrder"
  ADD CONSTRAINT "FoodOrder_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "ReservationRequest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;