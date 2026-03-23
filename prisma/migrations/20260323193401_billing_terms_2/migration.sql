/*
  Warnings:

  - The `billingTerms` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `billingTerms` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `billingTerms` column on the `Vendor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "billingTerms",
ADD COLUMN     "billingTerms" "BillingTerms";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "billingTerms",
ADD COLUMN     "billingTerms" "BillingTerms";

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "billingTerms",
ADD COLUMN     "billingTerms" "BillingTerms";
