-- CreateTable
CREATE TABLE "public"."AvendorMaterialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorMaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorMaterialCategory_name_key" ON "public"."AvendorMaterialCategory"("name");

-- CreateIndex
CREATE INDEX "AvendorMaterial_categoryId_idx" ON "public"."AvendorMaterial"("categoryId");

-- CreateIndex
CREATE INDEX "AvendorMaterial_name_idx" ON "public"."AvendorMaterial"("name");

-- AddForeignKey
ALTER TABLE "public"."AvendorMaterial" ADD CONSTRAINT "AvendorMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."AvendorMaterialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
