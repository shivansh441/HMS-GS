INSERT INTO "FeeType" ("name", "isSystemDefined", "isActive", "updatedAt")
VALUES
  ('Hostel GST', true, true, CURRENT_TIMESTAMP),
  ('Mess GST', true, true, CURRENT_TIMESTAMP),
  ('Bed Charges GST', true, true, CURRENT_TIMESTAMP),
  ('Unit Charges GST', true, true, CURRENT_TIMESTAMP),
  ('Electricity Bill GST', true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "isSystemDefined" = true,
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;
