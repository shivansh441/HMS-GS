-- Preserve the existing property assignment before replacing the join table.
ALTER TABLE "Account" ADD COLUMN "residentPropertyId" INTEGER;

UPDATE "Account" AS account
SET "residentPropertyId" = assignment."B"
FROM (
  SELECT DISTINCT ON ("A") "A", "B"
  FROM "_PropertyResidents"
  ORDER BY "A", "B"
) AS assignment
WHERE account."id" = assignment."A";

CREATE INDEX "Account_residentPropertyId_idx" ON "Account"("residentPropertyId");

ALTER TABLE "Account"
ADD CONSTRAINT "Account_residentPropertyId_fkey"
FOREIGN KEY ("residentPropertyId") REFERENCES "Property"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE "_PropertyResidents";
