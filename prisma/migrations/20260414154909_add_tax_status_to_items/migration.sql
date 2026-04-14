/*
  Warnings:

  - The `taxStatus` column on the `Customer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('TAXABLE', 'EXEMPT');

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "taxStatus",
ADD COLUMN     "taxStatus" "TaxStatus" NOT NULL DEFAULT 'TAXABLE';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "taxStatus" "TaxStatus" NOT NULL DEFAULT 'TAXABLE';

-- DropEnum
DROP TYPE "CustomerTaxStatus";
