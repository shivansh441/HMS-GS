ALTER TYPE "CustomerType" ADD VALUE IF NOT EXISTS 'GUEST';

ALTER TABLE "ReservationRequest" ADD COLUMN "primaryAccountId" INTEGER;
ALTER TABLE "ReservationOccupant" ADD COLUMN "accountId" INTEGER;
ALTER TABLE "AccompanyingGuest" ADD COLUMN "accountId" INTEGER;

CREATE INDEX "ReservationRequest_primaryAccountId_idx" ON "ReservationRequest"("primaryAccountId");
CREATE INDEX "ReservationOccupant_accountId_idx" ON "ReservationOccupant"("accountId");
CREATE INDEX "AccompanyingGuest_accountId_idx" ON "AccompanyingGuest"("accountId");

ALTER TABLE "ReservationRequest"
  ADD CONSTRAINT "ReservationRequest_primaryAccountId_fkey"
  FOREIGN KEY ("primaryAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReservationOccupant"
  ADD CONSTRAINT "ReservationOccupant_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccompanyingGuest"
  ADD CONSTRAINT "AccompanyingGuest_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;