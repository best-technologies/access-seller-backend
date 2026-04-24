-- Supplier-side quote submissions against an RFQ, with per-item price options
-- (a vendor may offer multiple quality tiers for the same RFQ item).

-- CreateEnum
CREATE TYPE "AvendorVendorQuoteStatus" AS ENUM ('draft', 'submitted', 'withdrawn', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "AvendorVendorQuote" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "AvendorVendorQuoteStatus" NOT NULL DEFAULT 'submitted',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "submittedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvendorVendorQuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "rfqItemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "quality" TEXT,
    "possibleDeliveryAt" TIMESTAMP(3),
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorQuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorQuote_quoteNumber_key" ON "AvendorVendorQuote"("quoteNumber");

-- CreateIndex
CREATE INDEX "AvendorVendorQuote_rfqId_idx" ON "AvendorVendorQuote"("rfqId");

-- CreateIndex
CREATE INDEX "AvendorVendorQuote_vendorId_idx" ON "AvendorVendorQuote"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorQuote_status_idx" ON "AvendorVendorQuote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorQuote_rfqId_vendorId_key" ON "AvendorVendorQuote"("rfqId", "vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorQuoteLine_quoteId_idx" ON "AvendorVendorQuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "AvendorVendorQuoteLine_rfqItemId_idx" ON "AvendorVendorQuoteLine"("rfqItemId");

-- AddForeignKey
ALTER TABLE "AvendorVendorQuote" ADD CONSTRAINT "AvendorVendorQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "AvendorRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorQuote" ADD CONSTRAINT "AvendorVendorQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorQuoteLine" ADD CONSTRAINT "AvendorVendorQuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "AvendorVendorQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorQuoteLine" ADD CONSTRAINT "AvendorVendorQuoteLine_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "AvendorRfqItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
