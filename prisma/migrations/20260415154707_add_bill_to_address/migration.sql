-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "billToAddress" TEXT,
ADD COLUMN     "billToAddress2" TEXT,
ADD COLUMN     "billToCity" TEXT,
ADD COLUMN     "billToCountry" TEXT DEFAULT 'US',
ADD COLUMN     "billToState" TEXT,
ADD COLUMN     "billToZipcode" TEXT;
