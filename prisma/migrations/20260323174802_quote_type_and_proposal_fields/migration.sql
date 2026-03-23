-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "clientResponsibilities" TEXT,
ADD COLUMN     "isDirect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scopeOfWork" TEXT,
ADD COLUMN     "termsAndConditions" TEXT;
