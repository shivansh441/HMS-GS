ALTER TABLE "AccompanyingGuest"
ADD COLUMN "address" TEXT,
ADD COLUMN "idProofPhotoUrl" TEXT;

ALTER TABLE "Account"
ADD COLUMN "idProofPhotoUrl" TEXT;
