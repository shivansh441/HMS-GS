-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveQuota" DROP CONSTRAINT "LeaveQuota_accountId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_accountId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_reviewedById_fkey";

-- DropTable
DROP TABLE "Attendance";

-- DropTable
DROP TABLE "LeaveQuota";

-- DropTable
DROP TABLE "LeaveRequest";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "LeaveType";
