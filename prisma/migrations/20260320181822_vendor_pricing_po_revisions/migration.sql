-- AlterEnum
ALTER TYPE "NoteDocumentType" ADD VALUE 'PURCHASE_ORDER';

-- AlterEnum
ALTER TYPE "POStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "preferredVendorId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PurchaseOrderLine" ADD COLUMN     "costOverridden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VendorItemPrice" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "leadTimeDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorItemPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorItemPrice_vendorId_itemId_key" ON "VendorItemPrice"("vendorId", "itemId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorItemPrice" ADD CONSTRAINT "VendorItemPrice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorItemPrice" ADD CONSTRAINT "VendorItemPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
