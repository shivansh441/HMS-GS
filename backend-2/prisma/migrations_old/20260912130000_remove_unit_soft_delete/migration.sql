DELETE FROM "Unit" AS unit
WHERE unit."isDeleted" = true
	AND NOT EXISTS (
		SELECT 1
		FROM "UnitAssignment" AS assignment
		WHERE assignment."unitId" = unit."id"
	);

DROP INDEX IF EXISTS "Unit_isDeleted_idx";
ALTER TABLE "Unit" DROP COLUMN IF EXISTS "isDeleted";