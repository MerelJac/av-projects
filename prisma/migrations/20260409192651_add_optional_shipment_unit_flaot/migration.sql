/*
  Warnings:

  - You are about to alter the column `unitCost` on the `ProjectCost` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "ProjectCost" ALTER COLUMN "unitCost" SET DATA TYPE DOUBLE PRECISION;
