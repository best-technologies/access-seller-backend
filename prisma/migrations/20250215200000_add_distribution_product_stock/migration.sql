-- CreateTable
CREATE TABLE "DistributionProduct" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DistributionProduct_sku_key" ON "DistributionProduct"("sku");

-- CreateIndex
CREATE INDEX "DistributionProduct_sku_idx" ON "DistributionProduct"("sku");

-- CreateIndex
CREATE INDEX "DistributionProduct_name_idx" ON "DistributionProduct"("name");

-- CreateIndex
CREATE INDEX "DistributionProduct_category_idx" ON "DistributionProduct"("category");

-- CreateIndex
CREATE INDEX "DistributionProduct_isActive_idx" ON "DistributionProduct"("isActive");

-- Add productId to ConsignmentItem
ALTER TABLE "ConsignmentItem" ADD COLUMN "productId" TEXT;

-- CreateIndex
CREATE INDEX "ConsignmentItem_productId_idx" ON "ConsignmentItem"("productId");

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DistributionProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
