/*
  Warnings:

  - You are about to drop the column `cost` on the `ShipmentLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "cost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ShipmentLine" DROP COLUMN "cost";
