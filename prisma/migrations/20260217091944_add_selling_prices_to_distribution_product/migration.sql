-- AlterTable: add selling price columns to DistributionProduct (idempotent).
-- Consignment_invoiceNumber_key already exists from 20250215050000_consignment_professional_fields.
ALTER TABLE "DistributionProduct" ADD COLUMN IF NOT EXISTS "normalSellingPrice" DOUBLE PRECISION;
ALTER TABLE "DistributionProduct" ADD COLUMN IF NOT EXISTS "discountedSellingPrice" DOUBLE PRECISION;
