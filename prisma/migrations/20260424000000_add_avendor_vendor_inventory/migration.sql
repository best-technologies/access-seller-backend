-- Vendor-scoped inventory for the supplier portal
-- Categories and materials are tied to a specific AvendorVendor so each
-- supplier manages their own stock independently.

-- CreateTable
CREATE TABLE "AvendorVendorInventoryCategory" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "skuPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorInventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvendorVendorInventoryMaterial" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorInventoryMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvendorVendorInventoryCategory_vendorId_idx" ON "AvendorVendorInventoryCategory"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorInventoryCategory_vendorId_name_key" ON "AvendorVendorInventoryCategory"("vendorId", "name");

-- CreateIndex
CREATE INDEX "AvendorVendorInventoryMaterial_vendorId_idx" ON "AvendorVendorInventoryMaterial"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorInventoryMaterial_categoryId_idx" ON "AvendorVendorInventoryMaterial"("categoryId");

-- CreateIndex
CREATE INDEX "AvendorVendorInventoryMaterial_name_idx" ON "AvendorVendorInventoryMaterial"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorInventoryMaterial_vendorId_sku_key" ON "AvendorVendorInventoryMaterial"("vendorId", "sku");

-- AddForeignKey
ALTER TABLE "AvendorVendorInventoryCategory" ADD CONSTRAINT "AvendorVendorInventoryCategory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorInventoryMaterial" ADD CONSTRAINT "AvendorVendorInventoryMaterial_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvendorVendorInventoryMaterial" ADD CONSTRAINT "AvendorVendorInventoryMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AvendorVendorInventoryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
