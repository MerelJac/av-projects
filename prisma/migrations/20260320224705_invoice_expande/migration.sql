-- CreateEnum
CREATE TYPE "InvoiceChargeType" AS ENUM ('LINE_ITEMS', 'PERCENTAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceStatus" ADD VALUE 'PENDING';
ALTER TYPE "InvoiceStatus" ADD VALUE 'REJECTED';
ALTER TYPE "InvoiceStatus" ADD VALUE 'REVISED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billToAddress" TEXT,
ADD COLUMN     "chargePercent" DOUBLE PRECISION,
ADD COLUMN     "chargeType" "InvoiceChargeType" NOT NULL DEFAULT 'LINE_ITEMS',
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "shipToAddress" TEXT,
ALTER COLUMN "amount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quoteLineId" TEXT,
    "quoteBundleId" TEXT,
    "isBundleTotal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
