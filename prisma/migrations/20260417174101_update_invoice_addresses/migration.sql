-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billToAddress2" TEXT,
ADD COLUMN     "billToAddress_dep" TEXT,
ADD COLUMN     "billToCity" TEXT,
ADD COLUMN     "billToCountry" TEXT DEFAULT 'US',
ADD COLUMN     "billToState" TEXT,
ADD COLUMN     "billToZipcode" TEXT,
ADD COLUMN     "shipToAddress2" TEXT,
ADD COLUMN     "shipToAddress_dep" TEXT,
ADD COLUMN     "shipToCity" TEXT,
ADD COLUMN     "shipToCountry" TEXT DEFAULT 'US',
ADD COLUMN     "shipToState" TEXT,
ADD COLUMN     "shipToZipcode" TEXT;
