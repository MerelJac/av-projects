-- AlterEnum
ALTER TYPE "InventoryMovementType" ADD VALUE 'BOM_ALLOCATION';

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "bomLineId" TEXT;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "BOMLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
