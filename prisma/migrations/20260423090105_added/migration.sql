/*
  Warnings:

  - A unique constraint covering the columns `[avendorVendorId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."AvendorPaymentApprovalStatus" AS ENUM ('pending', 'approved');

-- AlterTable
ALTER TABLE "public"."AvendorRfq" ADD COLUMN     "awardedVendorId" TEXT,
ADD COLUMN     "submissionDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."AvendorVendor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "public"."AvendorVendorDocument" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avendorVendorId" TEXT;

-- CreateTable
CREATE TABLE "public"."AvendorVendorInventoryItem" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorVendorApprovedPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "public"."AvendorPaymentApprovalStatus" NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorApprovedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvendorVendorInventoryItem_vendorId_idx" ON "public"."AvendorVendorInventoryItem"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorApprovedPayment_vendorId_status_idx" ON "public"."AvendorVendorApprovedPayment"("vendorId", "status");

-- CreateIndex
CREATE INDEX "AvendorRfq_awardedVendorId_idx" ON "public"."AvendorRfq"("awardedVendorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_avendorVendorId_key" ON "public"."User"("avendorVendorId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_avendorVendorId_fkey" FOREIGN KEY ("avendorVendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorRfq" ADD CONSTRAINT "AvendorRfq_awardedVendorId_fkey" FOREIGN KEY ("awardedVendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorVendorInventoryItem" ADD CONSTRAINT "AvendorVendorInventoryItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorVendorApprovedPayment" ADD CONSTRAINT "AvendorVendorApprovedPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
