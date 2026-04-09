/*
  Warnings:

  - The values [INVOICE,RETURN] on the enum `InventoryMovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryMovementType_new" AS ENUM ('RECEIPT', 'BOM_ALLOCATION', 'ADJUSTMENT', 'RETURN_TO_INVENTORY', 'RETURN_TO_VENDOR');
ALTER TABLE "InventoryMovement" ALTER COLUMN "type" TYPE "InventoryMovementType_new" USING ("type"::text::"InventoryMovementType_new");
ALTER TYPE "InventoryMovementType" RENAME TO "InventoryMovementType_old";
ALTER TYPE "InventoryMovementType_new" RENAME TO "InventoryMovementType";
DROP TYPE "public"."InventoryMovementType_old";
COMMIT;
