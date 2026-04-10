-- CreateTable
CREATE TABLE "VertexLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "documentNumber" TEXT,
    "requestXml" TEXT NOT NULL,
    "responseXml" TEXT,
    "success" BOOLEAN NOT NULL,
    "totalTax" DOUBLE PRECISION,
    "errorMessage" TEXT,

    CONSTRAINT "VertexLog_pkey" PRIMARY KEY ("id")
);
