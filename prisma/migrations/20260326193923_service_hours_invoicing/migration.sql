-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "scopeId" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProjectScope" ADD COLUMN     "costPerHour" DOUBLE PRECISION,
ADD COLUMN     "ratePerHour" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
