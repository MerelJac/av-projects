/*
  Warnings:

  - A unique constraint covering the columns `[bcId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bcId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bcId]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "bcId" TEXT,
ADD COLUMN     "bcSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "bcId" TEXT,
ADD COLUMN     "bcSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "bcId" TEXT,
ADD COLUMN     "bcSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BcSyncLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "synced" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BcSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_bcId_key" ON "Customer"("bcId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_bcId_key" ON "Item"("bcId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_bcId_key" ON "Vendor"("bcId");
