-- Public `vendorCode` (av-YYYY-XXX) vs internal PK `id` (cuid).
-- Legacy rows used `id` in the `av-...` form; we keep their PK and copy the same value to `vendorCode` for a stable public code field.

-- AlterTable
ALTER TABLE "AvendorVendor" ADD COLUMN "vendorCode" TEXT;

-- Backfill: existing rows created with business id as primary key
UPDATE "AvendorVendor" SET "vendorCode" = "id" WHERE "id" ~ '^av-';

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendor_vendorCode_key" ON "AvendorVendor"("vendorCode");
