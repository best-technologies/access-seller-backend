-- CreateEnum
CREATE TYPE "ConsignmentStatus" AS ENUM ('pending', 'received', 'inspected', 'available', 'partial_out', 'closed');

-- CreateEnum
CREATE TYPE "BulkOrderStatus" AS ENUM ('pending', 'confirmed', 'packing', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "Consignment" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierReference" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "ConsignmentStatus" NOT NULL DEFAULT 'pending',
    "warehouseLocation" TEXT,
    "notes" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentItem" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "unitCost" DOUBLE PRECISION,
    "condition" TEXT DEFAULT 'new',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentDocument" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOrder" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "buyerCompany" TEXT,
    "status" "BulkOrderStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOrderItem" (
    "id" TEXT NOT NULL,
    "bulkOrderId" TEXT NOT NULL,
    "consignmentItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consignment_referenceNumber_key" ON "Consignment"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrder_referenceNumber_key" ON "BulkOrder"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrderItem_bulkOrderId_consignmentItemId_key" ON "BulkOrderItem"("bulkOrderId", "consignmentItemId");

-- CreateIndex
CREATE INDEX "BulkOrderItem_bulkOrderId_idx" ON "BulkOrderItem"("bulkOrderId");

-- CreateIndex
CREATE INDEX "BulkOrderItem_consignmentItemId_idx" ON "BulkOrderItem"("consignmentItemId");

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "Consignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentDocument" ADD CONSTRAINT "ConsignmentDocument_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "Consignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOrderItem" ADD CONSTRAINT "BulkOrderItem_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOrderItem" ADD CONSTRAINT "BulkOrderItem_consignmentItemId_fkey" FOREIGN KEY ("consignmentItemId") REFERENCES "ConsignmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
