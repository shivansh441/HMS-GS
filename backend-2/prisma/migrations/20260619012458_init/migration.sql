/*
  Warnings:

  - Added the required column `reservationId` to the `FinancialLedger` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FolioType" AS ENUM ('MAIN', 'INCIDENTAL');

-- AlterTable
ALTER TABLE "FinancialLedger" ADD COLUMN     "folioType" "FolioType" NOT NULL DEFAULT 'MAIN',
ADD COLUMN     "reservationId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER,
    "propertyId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_propertyId_idx" ON "AuditLog"("propertyId");

-- CreateIndex
CREATE INDEX "AuditLog_accountId_idx" ON "AuditLog"("accountId");

-- CreateIndex
CREATE INDEX "FinancialLedger_reservationId_idx" ON "FinancialLedger"("reservationId");

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ReservationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
