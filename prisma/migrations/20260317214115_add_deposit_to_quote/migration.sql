-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "depositAmount" DOUBLE PRECISION,
ADD COLUMN     "depositInvoiceId" TEXT,
ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositPaidAt" TIMESTAMP(3),
ADD COLUMN     "depositPct" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_depositInvoiceId_fkey" FOREIGN KEY ("depositInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
