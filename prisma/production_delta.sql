-- CreateEnum
CREATE TYPE "public"."ConsignmentStatus" AS ENUM ('pending', 'received', 'inspected', 'available', 'partial_out', 'closed');

-- CreateEnum
CREATE TYPE "public"."BulkOrderStatus" AS ENUM ('pending', 'confirmed', 'packing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."BulkOrderPaymentStatus" AS ENUM ('pending', 'partial', 'paid');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('draft', 'issued', 'partial', 'paid', 'overdue', 'cancelled');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "usertype" TEXT;

-- CreateTable
CREATE TABLE "public"."Consignment" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierReference" TEXT,
    "salesPersonName" TEXT,
    "salesPersonPhone" TEXT,
    "salesPersonEmail" TEXT,
    "invoiceNumber" TEXT,
    "deliveryNote" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTime" TEXT,
    "paymentModeTerms" TEXT,
    "manufacturerOrderNumber" TEXT,
    "dispatchDocumentNumber" TEXT,
    "overallTotalCartons" INTEGER DEFAULT 0,
    "overallTotalQuantity" INTEGER DEFAULT 0,
    "overallTotalCost" DOUBLE PRECISION DEFAULT 0,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "totalPaid" DOUBLE PRECISION DEFAULT 0,
    "balanceToPay" DOUBLE PRECISION DEFAULT 0,
    "amountToPayInWords" TEXT,
    "amountPaidInWords" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "public"."ConsignmentStatus" NOT NULL DEFAULT 'pending',
    "warehouseLocation" TEXT,
    "notes" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsignmentItem" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "sku" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "cartons" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "condition" TEXT DEFAULT 'new',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsignmentDocument" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkOrder" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "buyerCompany" TEXT,
    "status" "public"."BulkOrderStatus" NOT NULL DEFAULT 'pending',
    "totalAmount" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION DEFAULT 0,
    "paymentStatus" "public"."BulkOrderPaymentStatus" DEFAULT 'pending',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkOrderDocument" (
    "id" TEXT NOT NULL,
    "bulkOrderId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkOrderItem" (
    "id" TEXT NOT NULL,
    "bulkOrderId" TEXT NOT NULL,
    "consignmentItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DistributionProduct" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION,
    "reorderLevel" INTEGER,
    "warehouseLocation" TEXT,
    "images" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bulkOrderId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerCompany" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'draft',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountInWords" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "managerSignedBy" TEXT,
    "managerSignedAt" TIMESTAMP(3),
    "customerSignedBy" TEXT,
    "customerSignedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "receiptPublicId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consignment_referenceNumber_key" ON "public"."Consignment"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Consignment_invoiceNumber_key" ON "public"."Consignment"("invoiceNumber");

-- CreateIndex
CREATE INDEX "ConsignmentItem_productId_idx" ON "public"."ConsignmentItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrder_referenceNumber_key" ON "public"."BulkOrder"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrder_invoiceNumber_key" ON "public"."BulkOrder"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BulkOrderItem_bulkOrderId_idx" ON "public"."BulkOrderItem"("bulkOrderId");

-- CreateIndex
CREATE INDEX "BulkOrderItem_consignmentItemId_idx" ON "public"."BulkOrderItem"("consignmentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrderItem_bulkOrderId_consignmentItemId_key" ON "public"."BulkOrderItem"("bulkOrderId", "consignmentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionProduct_sku_key" ON "public"."DistributionProduct"("sku");

-- CreateIndex
CREATE INDEX "DistributionProduct_sku_idx" ON "public"."DistributionProduct"("sku");

-- CreateIndex
CREATE INDEX "DistributionProduct_name_idx" ON "public"."DistributionProduct"("name");

-- CreateIndex
CREATE INDEX "DistributionProduct_category_idx" ON "public"."DistributionProduct"("category");

-- CreateIndex
CREATE INDEX "DistributionProduct_isActive_idx" ON "public"."DistributionProduct"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issueDate_idx" ON "public"."Invoice"("issueDate");

-- CreateIndex
CREATE INDEX "Invoice_bulkOrderId_idx" ON "public"."Invoice"("bulkOrderId");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "public"."InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "public"."InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "public"."InvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "public"."AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "public"."AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Consignment" ADD CONSTRAINT "Consignment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "public"."Consignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."DistributionProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentDocument" ADD CONSTRAINT "ConsignmentDocument_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "public"."Consignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BulkOrderDocument" ADD CONSTRAINT "BulkOrderDocument_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "public"."BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BulkOrderItem" ADD CONSTRAINT "BulkOrderItem_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "public"."BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BulkOrderItem" ADD CONSTRAINT "BulkOrderItem_consignmentItemId_fkey" FOREIGN KEY ("consignmentItemId") REFERENCES "public"."ConsignmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "public"."BulkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."DistributionProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

