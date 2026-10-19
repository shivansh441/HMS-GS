-- TaxRule model was removed from schema.prisma; drop the now-unused table and its indexes/constraints.
ALTER TABLE "TaxRule" DROP CONSTRAINT IF EXISTS "TaxRule_feeTypeId_fkey";
ALTER TABLE "TaxRule" DROP CONSTRAINT IF EXISTS "TaxRule_propertyId_fkey";
DROP TABLE IF EXISTS "TaxRule";
