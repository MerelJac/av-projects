/*
  Warnings:

  - You are about to drop the column `billToAddress_dep` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `shipToAddress_dep` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "billToAddress_dep",
DROP COLUMN "shipToAddress_dep";
