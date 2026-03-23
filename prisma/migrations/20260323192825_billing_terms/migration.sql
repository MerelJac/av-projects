/*
  Warnings:

  - You are about to drop the column `paymentTerms` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `Vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "paymentTerms",
ADD COLUMN     "billingTerms" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "paymentTerms",
ADD COLUMN     "billingTerms" TEXT;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "paymentTerms",
ADD COLUMN     "billingTerms" TEXT;
