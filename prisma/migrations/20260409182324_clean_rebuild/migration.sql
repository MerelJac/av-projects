-- CreateEnum
CREATE TYPE "ProjectCostType" AS ENUM ('MATERIAL', 'LABOR', 'FREIGHT', 'OTHER');

-- AlterTable
ALTER TABLE "BOMLine" ADD COLUMN     "actualCost" DOUBLE PRECISION,
ADD COLUMN     "poLink" TEXT;

-- CreateTable
CREATE TABLE "ProjectCost" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bomId" TEXT,
    "bomLineId" TEXT,
    "itemId" TEXT,
    "costType" "ProjectCostType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "poLink" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectCost_projectId_idx" ON "ProjectCost"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCost_bomId_idx" ON "ProjectCost"("bomId");

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "BOMLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
