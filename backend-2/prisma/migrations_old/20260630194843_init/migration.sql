/*
  Warnings:

  - You are about to drop the column `managerId` on the `Property` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL_LEAVE', 'SICK_LEAVE', 'PRIVILEGE_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMP_OFF', 'LEAVE_WITHOUT_PAY');

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_managerId_fkey";

-- DropIndex
DROP INDEX "AmenitySchedule_accountId_idx";

-- DropIndex
DROP INDEX "TaxRule_isDeleted_idx";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "managerId",
ADD COLUMN     "geofenceRadius" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMPTZ(6),
    "clockOut" TIMESTAMPTZ(6),
    "clockInLat" DOUBLE PRECISION,
    "clockInLng" DOUBLE PRECISION,
    "clockOutLat" DOUBLE PRECISION,
    "clockOutLng" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveQuota" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "totalAllotted" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isNational" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryDeduction" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeductionType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PropertyManagers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PropertyManagers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Attendance_propertyId_date_idx" ON "Attendance"("propertyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_accountId_date_key" ON "Attendance"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveQuota_accountId_year_leaveType_key" ON "LeaveQuota"("accountId", "year", "leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_propertyId_date_key" ON "PublicHoliday"("propertyId", "date");

-- CreateIndex
CREATE INDEX "_PropertyManagers_B_index" ON "_PropertyManagers"("B");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveQuota" ADD CONSTRAINT "LeaveQuota_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicHoliday" ADD CONSTRAINT "PublicHoliday_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryDeduction" ADD CONSTRAINT "SalaryDeduction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyManagers" ADD CONSTRAINT "_PropertyManagers_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyManagers" ADD CONSTRAINT "_PropertyManagers_B_fkey" FOREIGN KEY ("B") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
