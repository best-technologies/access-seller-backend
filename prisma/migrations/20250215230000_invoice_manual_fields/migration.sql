-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "companyAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "companyPhone" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "amountInWords" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "managerSignedBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "managerSignedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "customerSignedBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customerSignedAt" TIMESTAMP(3);
