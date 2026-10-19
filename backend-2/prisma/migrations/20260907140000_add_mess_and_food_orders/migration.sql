CREATE TYPE "MealType" AS ENUM ('ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS');
CREATE TYPE "FoodOrderStatus" AS ENUM ('PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

CREATE TABLE "HostelWeeklyMenu" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "weekStart" DATE,
  "isPermanent" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "HostelWeeklyMenu_propertyId_weekStart_key" ON "HostelWeeklyMenu"("propertyId", "weekStart");
CREATE INDEX "HostelWeeklyMenu_propertyId_isPermanent_isPublished_idx" ON "HostelWeeklyMenu"("propertyId", "isPermanent", "isPublished");

CREATE TABLE "HostelMenuItem" (
  "id" SERIAL PRIMARY KEY,
  "menuId" INTEGER NOT NULL REFERENCES "HostelWeeklyMenu"("id") ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL,
  "mealType" "MealType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX "HostelMenuItem_menuId_dayOfWeek_mealType_idx" ON "HostelMenuItem"("menuId", "dayOfWeek", "mealType");

CREATE TABLE "HostelMealAssignment" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "accountId" INTEGER NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
  "menuId" INTEGER NOT NULL REFERENCES "HostelWeeklyMenu"("id") ON DELETE CASCADE,
  "mealType" "MealType" NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HostelMealAssignment_accountId_menuId_mealType_key" UNIQUE ("accountId", "menuId", "mealType")
);
CREATE INDEX "HostelMealAssignment_propertyId_accountId_isActive_idx" ON "HostelMealAssignment"("propertyId", "accountId", "isActive");

CREATE TABLE "FoodMenuItem" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "FoodMenuItem_propertyId_isAvailable_isDeleted_idx" ON "FoodMenuItem"("propertyId", "isAvailable", "isDeleted");

CREATE TABLE "FoodOrder" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("id") ON DELETE RESTRICT,
  "reservationId" INTEGER NOT NULL REFERENCES "ReservationRequest"("id") ON DELETE RESTRICT,
  "unitAssignmentId" INTEGER REFERENCES "UnitAssignment"("id") ON DELETE SET NULL,
  "accountId" INTEGER NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT,
  "status" "FoodOrderStatus" NOT NULL DEFAULT 'PLACED',
  "notes" TEXT,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "FoodOrder_propertyId_status_createdAt_idx" ON "FoodOrder"("propertyId", "status", "createdAt");
CREATE INDEX "FoodOrder_reservationId_idx" ON "FoodOrder"("reservationId");
CREATE INDEX "FoodOrder_accountId_idx" ON "FoodOrder"("accountId");

CREATE TABLE "FoodOrderItem" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "FoodOrder"("id") ON DELETE CASCADE,
  "menuItemId" INTEGER REFERENCES "FoodMenuItem"("id") ON DELETE SET NULL,
  "itemNameSnapshot" TEXT NOT NULL,
  "unitPriceSnapshot" DECIMAL(10,2) NOT NULL,
  "taxRateSnapshot" DECIMAL(5,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lineTotal" DECIMAL(10,2) NOT NULL
);
CREATE INDEX "FoodOrderItem_orderId_idx" ON "FoodOrderItem"("orderId");