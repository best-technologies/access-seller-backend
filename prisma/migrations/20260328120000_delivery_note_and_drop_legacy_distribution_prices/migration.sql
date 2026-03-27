-- Align migration replay with schema.prisma and databases that already match it:
-- 1) 20260217091944 re-added normalSellingPrice/discountedSellingPrice after they were
--    renamed to wholesalePrice/retailPrice; drop them so a full replay matches the model.
-- 2) DeliveryNote exists in schema but was never added via a prior migration (e.g. db push).

ALTER TABLE "DistributionProduct" DROP COLUMN IF EXISTS "normalSellingPrice";
ALTER TABLE "DistributionProduct" DROP COLUMN IF EXISTS "discountedSellingPrice";

CREATE TABLE IF NOT EXISTS "DeliveryNote" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "authorisedBy" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT 'Goods delivered in good condition are not returnable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryNote_invoiceId_key" ON "DeliveryNote"("invoiceId");
CREATE INDEX IF NOT EXISTS "DeliveryNote_invoiceId_idx" ON "DeliveryNote"("invoiceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeliveryNote_invoiceId_fkey'
  ) THEN
    ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
