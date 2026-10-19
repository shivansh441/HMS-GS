CREATE TABLE "PropertyRecurringCharge" (
  "id" SERIAL NOT NULL,
  "propertyId" INTEGER NOT NULL,
  "feeTypeId" INTEGER NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyRecurringCharge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyRecurringCharge_propertyId_feeTypeId_key" ON "PropertyRecurringCharge"("propertyId", "feeTypeId");
CREATE INDEX "PropertyRecurringCharge_propertyId_isActive_idx" ON "PropertyRecurringCharge"("propertyId", "isActive");
ALTER TABLE "PropertyRecurringCharge" ADD CONSTRAINT "PropertyRecurringCharge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyRecurringCharge" ADD CONSTRAINT "PropertyRecurringCharge_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;