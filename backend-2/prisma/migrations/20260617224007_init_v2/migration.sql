-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('HOSTELER', 'HOSTEL_GUEST', 'HOTEL_GUEST', 'NONE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "IdProofType" AS ENUM ('AADHAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED', 'HOTEL', 'CO_LIVING');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('BED', 'ROOM', 'SUITE');

-- CreateEnum
CREATE TYPE "UnitCategory" AS ENUM ('CLASSIC', 'DELUXE', 'SUPER_DELUXE', 'EXECUTIVE', 'SINGLE_ROOM', 'DOUBLE_ROOM', 'TRIPLE_ROOM', 'DORMITORY');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('MAINTENANCE', 'DEEP_CLEANING', 'STAFF_USE', 'OUT_OF_ORDER');

-- CreateEnum
CREATE TYPE "BillingStrategy" AS ENUM ('PER_NIGHT_STAY', 'RECURRING_MONTHLY');

-- CreateEnum
CREATE TYPE "LedgerCategory" AS ENUM ('ACCOMMODATION_FEE', 'PAYROLL', 'AMENITY_PURCHASE', 'FOOD_AND_BEVERAGE', 'PENALTY', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL', 'OVERDUE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED', 'CONVERTED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'CUSTOMER',
    "customerType" "CustomerType" NOT NULL DEFAULT 'NONE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "parentPhone" TEXT,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "idType" "IdProofType",
    "idNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "photoUrl" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "baseSalary" DECIMAL(10,2),
    "recurringSubsidy" DECIMAL(10,2),
    "joinDate" DATE,
    "leftDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "propertyId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL DEFAULT 'HOTEL',
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "floors" INTEGER NOT NULL DEFAULT 1,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "facilities" TEXT[],
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "managerId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "type" "UnitType" NOT NULL DEFAULT 'ROOM',
    "category" "UnitCategory" NOT NULL DEFAULT 'CLASSIC',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "pricePerNight" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "recurringMonthlyRate" DECIMAL(10,2),
    "features" TEXT[],
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitBlock" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "reason" "BlockReason" NOT NULL DEFAULT 'MAINTENANCE',
    "description" TEXT,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitAssignment" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "reservationRequestId" INTEGER,
    "billingStrategy" "BillingStrategy" NOT NULL DEFAULT 'PER_NIGHT_STAY',
    "expectedCheckIn" TIMESTAMPTZ(6) NOT NULL,
    "actualCheckIn" TIMESTAMPTZ(6),
    "expectedCheckOut" TIMESTAMPTZ(6),
    "actualCheckOut" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UnitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccompanyingGuest" (
    "id" SERIAL NOT NULL,
    "unitAssignmentId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender",
    "idType" "IdProofType",
    "idNumber" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccompanyingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialLedger" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "unitAssignmentId" INTEGER,
    "category" "LedgerCategory" NOT NULL,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'INCOME',
    "invoiceNumber" TEXT,
    "description" TEXT,
    "billingPeriodStart" DATE,
    "billingPeriodEnd" DATE,
    "dueDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "adjustments" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxBreakdown" JSONB,
    "serviceCharge" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FinancialLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" SERIAL NOT NULL,
    "ledgerId" INTEGER NOT NULL,
    "recordedByAccountId" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "referenceId" TEXT,
    "remarks" TEXT,
    "recordedByLabel" TEXT,
    "receivedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmenitySchedule" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "name" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "scheduleData" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AmenitySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationRequest" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "guestName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "requestedCategory" "UnitCategory" NOT NULL DEFAULT 'CLASSIC',
    "requestedType" "UnitType" NOT NULL DEFAULT 'ROOM',
    "requestedQuantity" INTEGER NOT NULL DEFAULT 1,
    "numberOfAdults" INTEGER NOT NULL DEFAULT 1,
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "expectedCheckIn" DATE NOT NULL,
    "expectedCheckOut" DATE NOT NULL,
    "purpose" TEXT,
    "specialRequests" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "convertedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ReservationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemStatusLog" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "performedByLabel" TEXT,
    "performedByAccountId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Account_role_customerType_idx" ON "Account"("role", "customerType");

-- CreateIndex
CREATE INDEX "Account_propertyId_idx" ON "Account"("propertyId");

-- CreateIndex
CREATE INDEX "Account_isActive_isDeleted_idx" ON "Account"("isActive", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Account_idType_idNumber_key" ON "Account"("idType", "idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_accountId_idx" ON "Session"("accountId");

-- CreateIndex
CREATE INDEX "Property_city_status_idx" ON "Property"("city", "status");

-- CreateIndex
CREATE INDEX "Property_isDeleted_idx" ON "Property"("isDeleted");

-- CreateIndex
CREATE INDEX "TaxRule_propertyId_isActive_idx" ON "TaxRule"("propertyId", "isActive");

-- CreateIndex
CREATE INDEX "TaxRule_isDeleted_idx" ON "TaxRule"("isDeleted");

-- CreateIndex
CREATE INDEX "Unit_propertyId_status_idx" ON "Unit"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Unit_isDeleted_idx" ON "Unit"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_unitNumber_key" ON "Unit"("propertyId", "unitNumber");

-- CreateIndex
CREATE INDEX "UnitBlock_unitId_startDate_endDate_idx" ON "UnitBlock"("unitId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "UnitAssignment_unitId_isActive_idx" ON "UnitAssignment"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "UnitAssignment_accountId_idx" ON "UnitAssignment"("accountId");

-- CreateIndex
CREATE INDEX "UnitAssignment_reservationRequestId_idx" ON "UnitAssignment"("reservationRequestId");

-- CreateIndex
CREATE INDEX "AccompanyingGuest_unitAssignmentId_idx" ON "AccompanyingGuest"("unitAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialLedger_invoiceNumber_key" ON "FinancialLedger"("invoiceNumber");

-- CreateIndex
CREATE INDEX "FinancialLedger_accountId_idx" ON "FinancialLedger"("accountId");

-- CreateIndex
CREATE INDEX "FinancialLedger_propertyId_idx" ON "FinancialLedger"("propertyId");

-- CreateIndex
CREATE INDEX "FinancialLedger_category_status_idx" ON "FinancialLedger"("category", "status");

-- CreateIndex
CREATE INDEX "FinancialLedger_isDeleted_idx" ON "FinancialLedger"("isDeleted");

-- CreateIndex
CREATE INDEX "PaymentReceipt_ledgerId_idx" ON "PaymentReceipt"("ledgerId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_referenceId_idx" ON "PaymentReceipt"("referenceId");

-- CreateIndex
CREATE INDEX "AmenitySchedule_propertyId_isActive_idx" ON "AmenitySchedule"("propertyId", "isActive");

-- CreateIndex
CREATE INDEX "AmenitySchedule_accountId_idx" ON "AmenitySchedule"("accountId");

-- CreateIndex
CREATE INDEX "ReservationRequest_propertyId_status_idx" ON "ReservationRequest"("propertyId", "status");

-- CreateIndex
CREATE INDEX "ReservationRequest_mobile_email_idx" ON "ReservationRequest"("mobile", "email");

-- CreateIndex
CREATE INDEX "SystemStatusLog_entityType_entityId_idx" ON "SystemStatusLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SystemStatusLog_action_createdAt_idx" ON "SystemStatusLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRule" ADD CONSTRAINT "TaxRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitBlock" ADD CONSTRAINT "UnitBlock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAssignment" ADD CONSTRAINT "UnitAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAssignment" ADD CONSTRAINT "UnitAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAssignment" ADD CONSTRAINT "UnitAssignment_reservationRequestId_fkey" FOREIGN KEY ("reservationRequestId") REFERENCES "ReservationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccompanyingGuest" ADD CONSTRAINT "AccompanyingGuest_unitAssignmentId_fkey" FOREIGN KEY ("unitAssignmentId") REFERENCES "UnitAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_unitAssignmentId_fkey" FOREIGN KEY ("unitAssignmentId") REFERENCES "UnitAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "FinancialLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_recordedByAccountId_fkey" FOREIGN KEY ("recordedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenitySchedule" ADD CONSTRAINT "AmenitySchedule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenitySchedule" ADD CONSTRAINT "AmenitySchedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemStatusLog" ADD CONSTRAINT "SystemStatusLog_performedByAccountId_fkey" FOREIGN KEY ("performedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
