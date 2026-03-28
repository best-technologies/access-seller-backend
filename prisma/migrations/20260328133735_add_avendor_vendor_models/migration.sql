-- CreateEnum
CREATE TYPE "public"."AvendorVendorStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."AvendorComplianceStatus" AS ENUM ('compliant', 'non_compliant', 'warning');

-- CreateEnum
CREATE TYPE "public"."AvendorDocumentStatus" AS ENUM ('valid', 'expired', 'pending');

-- CreateTable
CREATE TABLE "public"."AvendorVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Nigeria',
    "status" "public"."AvendorVendorStatus" NOT NULL DEFAULT 'active',
    "complianceStatus" "public"."AvendorComplianceStatus" NOT NULL DEFAULT 'non_compliant',
    "complianceOverride" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorVendorBank" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorVendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "status" "public"."AvendorDocumentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvendorVendorNote" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorVendorNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvendorVendor_status_idx" ON "public"."AvendorVendor"("status");

-- CreateIndex
CREATE INDEX "AvendorVendor_complianceStatus_idx" ON "public"."AvendorVendor"("complianceStatus");

-- CreateIndex
CREATE INDEX "AvendorVendor_name_idx" ON "public"."AvendorVendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AvendorVendorBank_vendorId_key" ON "public"."AvendorVendorBank"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorDocument_vendorId_idx" ON "public"."AvendorVendorDocument"("vendorId");

-- CreateIndex
CREATE INDEX "AvendorVendorNote_vendorId_idx" ON "public"."AvendorVendorNote"("vendorId");

-- AddForeignKey
ALTER TABLE "public"."AvendorVendorBank" ADD CONSTRAINT "AvendorVendorBank_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorVendorDocument" ADD CONSTRAINT "AvendorVendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvendorVendorNote" ADD CONSTRAINT "AvendorVendorNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."AvendorVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
