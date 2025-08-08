-- CreateEnum
CREATE TYPE "DepotStatus" AS ENUM ('active', 'inactive', 'pending', 'rejected');

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "depot_officer_name" TEXT NOT NULL,
    "depot_officer_email" TEXT NOT NULL,
    "depot_officer_phone" TEXT NOT NULL,
    "depo_officer_house_address" TEXT NOT NULL,
    "description" TEXT,
    "status" "DepotStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Depot_storeId_key" ON "Depot"("storeId");

-- AddForeignKey
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
