-- AlterTable
ALTER TABLE "ProjectScope" ADD COLUMN     "bomId" TEXT,
ADD COLUMN     "bomLineId" TEXT;

-- AddForeignKey
ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "BOMLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
