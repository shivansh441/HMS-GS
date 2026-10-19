-- AlterTable Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "standardMessRate" DECIMAL(10,2);

-- AlterTable HostelMealAssignment
ALTER TABLE "HostelMealAssignment" ALTER COLUMN "menuId" DROP NOT NULL;
DROP INDEX IF EXISTS "HostelMealAssignment_accountId_menuId_key";

-- CreateTable StaffPropertyAssignment
CREATE TABLE IF NOT EXISTS "StaffPropertyAssignment" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "designation" TEXT,
    "startDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StaffPropertyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable StaffMonthlyWorkRecord
CREATE TABLE IF NOT EXISTS "StaffMonthlyWorkRecord" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "payrollPeriod" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "recordedByAccountId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StaffMonthlyWorkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable StaffPayrollRecord
CREATE TABLE IF NOT EXISTS "StaffPayrollRecord" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "payrollPeriod" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "workingDays" INTEGER,
    "grossSalary" DECIMAL(10,2) NOT NULL,
    "totalDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod",
    "paymentDate" DATE,
    "referenceId" TEXT,
    "notes" TEXT,
    "workRecordId" INTEGER,
    "processedByAccountId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StaffPayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable StaffSalaryRevision
CREATE TABLE IF NOT EXISTS "StaffSalaryRevision" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "previousSalary" DECIMAL(10,2),
    "newSalary" DECIMAL(10,2) NOT NULL,
    "effectiveDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "changedByAccountId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSalaryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StaffPropertyAssignment_propertyId_isActive_idx" ON "StaffPropertyAssignment"("propertyId", "isActive");
CREATE INDEX IF NOT EXISTS "StaffPropertyAssignment_accountId_idx" ON "StaffPropertyAssignment"("accountId");

CREATE UNIQUE INDEX IF NOT EXISTS "StaffMonthlyWorkRecord_accountId_payrollPeriod_key" ON "StaffMonthlyWorkRecord"("accountId", "payrollPeriod");
CREATE INDEX IF NOT EXISTS "StaffMonthlyWorkRecord_propertyId_payrollPeriod_idx" ON "StaffMonthlyWorkRecord"("propertyId", "payrollPeriod");
CREATE INDEX IF NOT EXISTS "StaffMonthlyWorkRecord_accountId_idx" ON "StaffMonthlyWorkRecord"("accountId");

CREATE UNIQUE INDEX IF NOT EXISTS "StaffPayrollRecord_accountId_payrollPeriod_key" ON "StaffPayrollRecord"("accountId", "payrollPeriod");
CREATE INDEX IF NOT EXISTS "StaffPayrollRecord_propertyId_payrollPeriod_idx" ON "StaffPayrollRecord"("propertyId", "payrollPeriod");
CREATE INDEX IF NOT EXISTS "StaffPayrollRecord_accountId_idx" ON "StaffPayrollRecord"("accountId");

CREATE INDEX IF NOT EXISTS "StaffSalaryRevision_accountId_effectiveDate_idx" ON "StaffSalaryRevision"("accountId", "effectiveDate");

-- AddForeignKey
ALTER TABLE "HostelMealAssignment" DROP CONSTRAINT IF EXISTS "HostelMealAssignment_menuId_fkey";
ALTER TABLE "HostelMealAssignment" ADD CONSTRAINT "HostelMealAssignment_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "HostelWeeklyMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffPropertyAssignment" ADD CONSTRAINT "StaffPropertyAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffPropertyAssignment" ADD CONSTRAINT "StaffPropertyAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffMonthlyWorkRecord" ADD CONSTRAINT "StaffMonthlyWorkRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffMonthlyWorkRecord" ADD CONSTRAINT "StaffMonthlyWorkRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffMonthlyWorkRecord" ADD CONSTRAINT "StaffMonthlyWorkRecord_recordedByAccountId_fkey" FOREIGN KEY ("recordedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffPayrollRecord" ADD CONSTRAINT "StaffPayrollRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffPayrollRecord" ADD CONSTRAINT "StaffPayrollRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffPayrollRecord" ADD CONSTRAINT "StaffPayrollRecord_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "StaffMonthlyWorkRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffPayrollRecord" ADD CONSTRAINT "StaffPayrollRecord_processedByAccountId_fkey" FOREIGN KEY ("processedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffSalaryRevision" ADD CONSTRAINT "StaffSalaryRevision_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffSalaryRevision" ADD CONSTRAINT "StaffSalaryRevision_changedByAccountId_fkey" FOREIGN KEY ("changedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
