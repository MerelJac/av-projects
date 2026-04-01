-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'SENT', 'CREDITED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "POStatus" ADD VALUE 'PARTIALLY_RETURNED';
ALTER TYPE "POStatus" ADD VALUE 'RETURNED';

-- CreateTable
CREATE TABLE "PurchaseOrderReturn" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT,
    "poId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "rmaNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderReturnLine" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "poLineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "creditPerUnit" DOUBLE PRECISION,

    CONSTRAINT "PurchaseOrderReturnLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PurchaseOrderReturn" ADD CONSTRAINT "PurchaseOrderReturn_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReturnLine" ADD CONSTRAINT "PurchaseOrderReturnLine_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "PurchaseOrderReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReturnLine" ADD CONSTRAINT "PurchaseOrderReturnLine_poLineId_fkey" FOREIGN KEY ("poLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
