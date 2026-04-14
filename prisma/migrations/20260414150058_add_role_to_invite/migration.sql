-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_trainerId_fkey";

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TEAM',
ALTER COLUMN "trainerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
