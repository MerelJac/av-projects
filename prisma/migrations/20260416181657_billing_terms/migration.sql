-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BillingTerms" ADD VALUE 'NET45';
ALTER TYPE "BillingTerms" ADD VALUE 'NET15';
ALTER TYPE "BillingTerms" ADD VALUE 'DUE_UPON_RECEIPT';
