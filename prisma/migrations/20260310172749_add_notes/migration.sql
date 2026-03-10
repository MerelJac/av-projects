-- CreateEnum
CREATE TYPE "NoteDocumentType" AS ENUM ('QUOTE', 'BILL_OF_MATERIALS', 'CHANGE_ORDER');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "documentType" "NoteDocumentType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_documentType_documentId_idx" ON "Note"("documentType", "documentId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
