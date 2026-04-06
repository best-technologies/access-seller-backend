-- CreateEnum
CREATE TYPE "public"."AvendorRfqStatus" AS ENUM ('draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled');

-- CreateTable
CREATE TABLE "public"."AvendorRfq" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."AvendorRfqStatus" NOT NULL DEFAULT 'draft',
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorRfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorRfqItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorRfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorRfqItemAttachment" (
    "id" TEXT NOT NULL,
    "rfqItemId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvendorRfqItemAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorRfqAttachment" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvendorRfqAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorRfqVendor" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvendorRfqVendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorRfq_rfqNumber_key" ON "public"."AvendorRfq"("rfqNumber");

-- CreateIndex
CREATE INDEX "AvendorRfq_status_idx" ON "public"."AvendorRfq"("status");

-- CreateIndex
CREATE INDEX "AvendorRfq_rfqNumber_idx" ON "public"."AvendorRfq"("rfqNumber");

-- CreateIndex
CREATE INDEX "AvendorRfq_createdById_idx" ON "public"."AvendorRfq"("createdById");

-- CreateIndex
CREATE INDEX "AvendorRfqItem_rfqId_idx" ON "public"."AvendorRfqItem"("rfqId");

-- CreateIndex
CREATE INDEX "AvendorRfqItem_materialId_idx" ON "public"."AvendorRfqItem"("materialId");

-- CreateIndex
CREATE INDEX "AvendorRfqItemAttachment_rfqItemId_idx" ON "public"."AvendorRfqItemAttachment"("rfqItemId");

-- CreateIndex
CREATE INDEX "AvendorRfqAttachment_rfqId_idx" ON "public"."AvendorRfqAttachment"("rfqId");

-- CreateIndex
CREATE INDEX "AvendorRfqVendor_rfqId_idx" ON "public"."AvendorRfqVendor"("rfqId");

-- CreateIndex
CREATE INDEX "AvendorRfqVendor_vendorId_idx" ON "public"."AvendorRfqVendor"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "AvendorRfqVendor_rfqId_vendorId_key" ON "public"."AvendorRfqVendor"("rfqId", "vendorId");

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqItem" ADD CONSTRAINT "AvendorRfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "public"."AvendorRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqItem" ADD CONSTRAINT "AvendorRfqItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."AvendorMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqItemAttachment" ADD CONSTRAINT "AvendorRfqItemAttachment_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "public"."AvendorRfqItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqAttachment" ADD CONSTRAINT "AvendorRfqAttachment_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "public"."AvendorRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqVendor" ADD CONSTRAINT "AvendorRfqVendor_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "public"."AvendorRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfqVendor" ADD CONSTRAINT "AvendorRfqVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
