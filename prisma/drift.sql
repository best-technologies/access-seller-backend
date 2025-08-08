-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'delivered';
ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'cancelled';
ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'returned';
ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'lost';
ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'damaged';
ALTER TYPE "public"."ShipmentStatus" ADD VALUE 'other';

-- DropIndex
DROP INDEX "public"."Depot_storeId_key";

-- CreateTable
CREATE TABLE "public"."ShippingInformation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shippingMethod" TEXT NOT NULL,
    "isPickup" BOOLEAN NOT NULL DEFAULT false,
    "trackingNumber" TEXT,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'Nigeria',
    "postalCode" TEXT,
    "parkLocation" TEXT,
    "pickupDate" TIMESTAMP(3),
    "depotId" TEXT,
    "deliveryInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInformation_order_unique" ON "public"."ShippingInformation"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInformation_orderId_key" ON "public"."ShippingInformation"("orderId");

-- AddForeignKey
ALTER TABLE "public"."ShippingInformation" ADD CONSTRAINT "ShippingInformation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingInformation" ADD CONSTRAINT "ShippingInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingInformation" ADD CONSTRAINT "ShippingInformation_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "public"."Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

