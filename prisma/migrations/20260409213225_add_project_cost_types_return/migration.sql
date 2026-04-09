-- AlterTable
ALTER TABLE "ProjectCost" ADD COLUMN     "poReturnId" TEXT;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_poReturnId_fkey" FOREIGN KEY ("poReturnId") REFERENCES "PurchaseOrderReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
