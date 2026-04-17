-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('PO_APPROVE', 'PO_CREATE', 'PO_EDIT', 'PROPOSAL_APPROVE', 'PROPOSAL_CREATE', 'PROPOSAL_EDIT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];
