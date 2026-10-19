ALTER TABLE "FinancialLedger" ADD COLUMN "billingKey" TEXT;

CREATE UNIQUE INDEX "FinancialLedger_billingKey_key" ON "FinancialLedger"("billingKey");