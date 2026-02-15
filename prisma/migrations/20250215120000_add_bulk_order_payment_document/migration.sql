-- CreateEnum
CREATE TYPE "BulkOrderPaymentStatus" AS ENUM ('pending', 'partial', 'paid');

-- AlterTable
ALTER TABLE "BulkOrder" ADD COLUMN "totalAmount" DOUBLE PRECISION;
ALTER TABLE "BulkOrder" ADD COLUMN "amountPaid" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "BulkOrder" ADD COLUMN "paymentStatus" "BulkOrderPaymentStatus" DEFAULT 'pending';
ALTER TABLE "BulkOrder" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "BulkOrder" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "BulkOrder" ADD COLUMN "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrder_invoiceNumber_key" ON "BulkOrder"("invoiceNumber");

-- CreateTable
CREATE TABLE "BulkOrderDocument" (
    "id" TEXT NOT NULL,
    "bulkOrderId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOrderDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BulkOrderDocument" ADD CONSTRAINT "BulkOrderDocument_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
