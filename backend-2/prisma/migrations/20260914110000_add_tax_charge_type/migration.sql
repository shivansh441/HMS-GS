CREATE TYPE "TaxChargeType" AS ENUM ('HOSTEL_FEE', 'MESS_FEE', 'HOTEL_GST', 'ELECTRICITY', 'OTHER');

ALTER TABLE "TaxRule"
  ADD COLUMN "chargeType" "TaxChargeType" NOT NULL DEFAULT 'OTHER';

UPDATE "TaxRule"
SET "chargeType" = 'HOSTEL_FEE'
WHERE LOWER("name") LIKE '%hostel%';

UPDATE "TaxRule"
SET "chargeType" = 'MESS_FEE'
WHERE LOWER("name") LIKE '%mess%' OR LOWER("name") LIKE '%food%';

UPDATE "TaxRule"
SET "chargeType" = 'HOTEL_GST'
WHERE LOWER("name") LIKE '%hotel%' OR LOWER("name") LIKE '%gst%';

UPDATE "TaxRule"
SET "chargeType" = 'ELECTRICITY'
WHERE LOWER("name") LIKE '%electric%';

CREATE INDEX "TaxRule_propertyId_chargeType_isActive_idx"
  ON "TaxRule"("propertyId", "chargeType", "isActive");