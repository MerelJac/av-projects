/*
  Warnings:

  - You are about to drop the column `billOfMaterialsId` on the `Quote` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_billOfMaterialsId_fkey";

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "billOfMaterialsId";

-- CreateTable
CREATE TABLE "QuoteBOM" (
    "quoteId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,

    CONSTRAINT "QuoteBOM_pkey" PRIMARY KEY ("quoteId","bomId")
);

-- AddForeignKey
ALTER TABLE "QuoteBOM" ADD CONSTRAINT "QuoteBOM_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteBOM" ADD CONSTRAINT "QuoteBOM_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
