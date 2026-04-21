-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "returnId" TEXT;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "PurchaseOrderReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
