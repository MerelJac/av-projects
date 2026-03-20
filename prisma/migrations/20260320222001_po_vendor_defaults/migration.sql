-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "billToAddress" TEXT,
ADD COLUMN     "buyerId" TEXT,
ADD COLUMN     "creditLimit" DECIMAL(10,2),
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "shipToAddress" TEXT,
ADD COLUMN     "shippingMethod" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "billToAddress" TEXT,
ADD COLUMN     "creditLimit" DECIMAL(10,2),
ADD COLUMN     "defaultBuyerId" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "shipToAddress" TEXT,
ADD COLUMN     "shippingMethod" TEXT;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_defaultBuyerId_fkey" FOREIGN KEY ("defaultBuyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
