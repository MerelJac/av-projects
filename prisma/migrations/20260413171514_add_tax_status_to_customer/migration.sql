-- CreateEnum
CREATE TYPE "CustomerTaxStatus" AS ENUM ('TAXABLE', 'EXEMPT');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "taxStatus" "CustomerTaxStatus" NOT NULL DEFAULT 'TAXABLE';
