-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "scopeId" TEXT;

-- CreateTable
CREATE TABLE "ProjectScope" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectScope_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
