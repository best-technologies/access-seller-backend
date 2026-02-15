-- Consignment: add professional invoice/delivery/payment fields
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "salesPersonName" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "salesPersonPhone" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "salesPersonEmail" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "deliveryNote" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP(3);
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "deliveryTime" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "paymentModeTerms" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "manufacturerOrderNumber" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "dispatchDocumentNumber" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "overallTotalCartons" INTEGER DEFAULT 0;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "overallTotalQuantity" INTEGER DEFAULT 0;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "overallTotalCost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "totalPaid" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "balanceToPay" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "amountToPayInWords" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "amountPaidInWords" TEXT;

-- Unique index for invoiceNumber
CREATE UNIQUE INDEX IF NOT EXISTS "Consignment_invoiceNumber_key" ON "Consignment"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;

-- ConsignmentItem: add productName, cartons, unitPrice, totalCost; make sku/description optional
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "cartons" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate existing rows: productName, unitPrice, totalCost
UPDATE "ConsignmentItem" SET "productName" = COALESCE("description", ''), "unitPrice" = COALESCE("unitCost", 0), "totalCost" = quantity * COALESCE("unitCost", 0) WHERE "productName" IS NULL;

-- Make sku and description nullable
ALTER TABLE "ConsignmentItem" ALTER COLUMN "sku" DROP NOT NULL;
ALTER TABLE "ConsignmentItem" ALTER COLUMN "description" DROP NOT NULL;
