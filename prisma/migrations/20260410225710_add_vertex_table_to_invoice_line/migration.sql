-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "productClass" TEXT,
ADD COLUMN     "taxAmount" DOUBLE PRECISION,
ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT true;
