-- Recurring "fixed monthly amount" charges are replaced by simple per-property
-- enable/disable toggles for optional extra-charge fee types (electricity, water,
-- maintenance, late fee, or a custom one). The actual amount is entered per hosteler
-- per billing period instead of being a fixed recurring value.
DROP TABLE IF EXISTS "PropertyRecurringCharge";

CREATE TABLE "PropertyChargeSetting" (
  "id" SERIAL NOT NULL,
  "propertyId" INTEGER NOT NULL,
  "feeTypeId" INTEGER NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyChargeSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyChargeSetting_propertyId_feeTypeId_key" ON "PropertyChargeSetting"("propertyId", "feeTypeId");
CREATE INDEX "PropertyChargeSetting_propertyId_isEnabled_idx" ON "PropertyChargeSetting"("propertyId", "isEnabled");
ALTER TABLE "PropertyChargeSetting" ADD CONSTRAINT "PropertyChargeSetting_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyChargeSetting" ADD CONSTRAINT "PropertyChargeSetting_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The old GST-era fee types are dead now that tax rules were removed; deactivate them
-- so they no longer show up as chargeable options, and seed the standard optional charges.
UPDATE "FeeType" SET "isActive" = false
WHERE "name" IN ('Hostel GST', 'Mess GST', 'Bed Charges GST', 'Unit Charges GST', 'Electricity Bill GST');

INSERT INTO "FeeType" ("name", "isSystemDefined", "isActive", "updatedAt")
VALUES
  ('Electricity Bill', true, true, CURRENT_TIMESTAMP),
  ('Water Bill', true, true, CURRENT_TIMESTAMP),
  ('Maintenance Charge', true, true, CURRENT_TIMESTAMP),
  ('Late Fee', true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "isSystemDefined" = true,
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;
