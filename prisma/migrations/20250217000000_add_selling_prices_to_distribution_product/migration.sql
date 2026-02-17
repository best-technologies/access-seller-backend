-- AlterTable
ALTER TABLE "DistributionProduct" ADD COLUMN IF NOT EXISTS "normalSellingPrice" DOUBLE PRECISION;
ALTER TABLE "DistributionProduct" ADD COLUMN IF NOT EXISTS "discountedSellingPrice" DOUBLE PRECISION;
