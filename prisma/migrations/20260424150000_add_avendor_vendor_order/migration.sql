-- Vendor Quotes History module: per-line award decisions, order lifecycle,
-- and payment-proof fields on approved payments.

-- CreateEnum
CREATE TYPE "AvendorVendorQuoteLineDecision" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "AvendorVendorOrderStage" AS ENUM ('created', 'in_production', 'in_transit', 'delivered', 'cancelled');

-- AlterTable: per-line admin decision
ALTER TABLE "AvendorVendorQuoteLine"
  ADD COLUMN "decision"     "AvendorVendorQuoteLineDecision" NOT NULL DEFAULT 'pending',
  ADD COLUMN "decisionNote" TEXT,
  ADD COLUMN "decisionAt"   TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AvendorVendorQuoteLine_decision_idx" ON "AvendorVendorQuoteLine"("decision");

-- AlterTable: link approved payments to a quote + capture proof upload
ALTER TABLE "AvendorVendorApprovedPayment"
  ADD COLUMN "quoteId"               TEXT,
  ADD COLUMN "label"                 TEXT,
  ADD COLUMN "percentage"            INTEGER,
  ADD COLUMN "proofUrl"              TEXT,
  ADD COLUMN "proofPublicId"         TEXT,
  ADD COLUMN "proofOriginalFilename" TEXT;

-- CreateIndex
CREATE INDEX "AvendorVendorApprovedPayment_quoteId_idx" ON "AvendorVendorApprovedPayment"("quoteId");

-- AddForeignKey
ALTER TABLE "AvendorVendorApprovedPayment"
  ADD CONSTRAINT "AvendorVendorApprovedPayment_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "AvendorVendorQuote"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: one order per awarded quote
CREATE TABLE "AvendorVendorOrder" (
    "id"                  TEXT                      NOT NULL,
    "quoteId"             TEXT                      NOT NULL,
    "vendorId"            TEXT                      NOT NULL,
    "stage"               "AvendorVendorOrderStage" NOT NULL DEFAULT 'created',
    "expectedDeliveryAt"  TIMESTAMP(3),
    "note"                TEXT,
    "productionStartedAt" TIMESTAMP(3),
    "shippedAt"           TIMESTAMP(3),
    "deliveredAt"         TIMESTAMP(3),
    "cancelledAt"         TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3)              NOT NULL,

    CONSTRAINT "AvendorVendorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorOrder_quoteId_key" ON "AvendorVendorOrder"("quoteId");

-- CreateIndex
CREATE INDEX "AvendorVendorOrder_vendorId_idx" ON "AvendorVendorOrder"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorOrder_stage_idx" ON "AvendorVendorOrder"("stage");

-- AddForeignKey
ALTER TABLE "AvendorVendorOrder"
  ADD CONSTRAINT "AvendorVendorOrder_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "AvendorVendorQuote"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorOrder"
  ADD CONSTRAINT "AvendorVendorOrder_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "AvendorVendor"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
