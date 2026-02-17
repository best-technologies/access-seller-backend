-- DistributionProduct: rename selling price columns to wholesale/retail
ALTER TABLE "DistributionProduct" RENAME COLUMN "normalSellingPrice" TO "wholesalePrice";
ALTER TABLE "DistributionProduct" RENAME COLUMN "discountedSellingPrice" TO "retailPrice";

-- ConsignmentItem: add wholesale and retail price per unit
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "wholesalePrice" DOUBLE PRECISION;
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "retailPrice" DOUBLE PRECISION;
