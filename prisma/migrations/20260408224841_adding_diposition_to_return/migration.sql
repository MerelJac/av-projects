-- CreateEnum
CREATE TYPE "ReturnDisposition" AS ENUM ('RETURN_TO_VENDOR', 'KEEP_IN_INVENTORY');

-- AlterTable
ALTER TABLE "PurchaseOrderReturn" ADD COLUMN     "disposition" "ReturnDisposition" NOT NULL DEFAULT 'RETURN_TO_VENDOR';
