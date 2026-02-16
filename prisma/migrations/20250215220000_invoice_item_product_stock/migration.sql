-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN "productId" TEXT;

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DistributionProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
