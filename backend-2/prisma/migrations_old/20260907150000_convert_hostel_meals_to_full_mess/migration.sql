ALTER TABLE "HostelWeeklyMenu"
  ADD COLUMN "fullMessPrice" DECIMAL(10,2);

ALTER TABLE "HostelMealAssignment"
  DROP CONSTRAINT "HostelMealAssignment_accountId_menuId_mealType_key";

ALTER TABLE "HostelMealAssignment"
  ADD COLUMN "monthlyRate" DECIMAL(10,2);

UPDATE "HostelMealAssignment" assignment
SET "monthlyRate" = COALESCE(menu."fullMessPrice", 0)
FROM "HostelWeeklyMenu" menu
WHERE assignment."menuId" = menu."id";

ALTER TABLE "HostelMealAssignment"
  ALTER COLUMN "monthlyRate" SET NOT NULL;

ALTER TABLE "HostelMealAssignment"
  DROP COLUMN "mealType";

ALTER TABLE "HostelMealAssignment"
  ADD CONSTRAINT "HostelMealAssignment_accountId_menuId_key" UNIQUE ("accountId", "menuId");