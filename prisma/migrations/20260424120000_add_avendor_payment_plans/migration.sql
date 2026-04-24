-- Admin-configurable payment plans + optional selection on each vendor quote

-- CreateEnum
CREATE TYPE "AvendorPaymentPlanSetBy" AS ENUM ('vendor', 'admin');

-- CreateTable
CREATE TABLE "AvendorPaymentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "netDays" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorPaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorPaymentPlan_code_key" ON "AvendorPaymentPlan"("code");

-- CreateIndex
CREATE INDEX "AvendorPaymentPlan_isActive_idx" ON "AvendorPaymentPlan"("isActive");

-- CreateIndex
CREATE INDEX "AvendorPaymentPlan_sortOrder_idx" ON "AvendorPaymentPlan"("sortOrder");

-- AlterTable
ALTER TABLE "AvendorVendorQuote" ADD COLUMN     "paymentPlanId" TEXT,
ADD COLUMN     "paymentPlanSetBy" "AvendorPaymentPlanSetBy",
ADD COLUMN     "paymentPlanSetAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AvendorVendorQuote_paymentPlanId_idx" ON "AvendorVendorQuote"("paymentPlanId");

-- AddForeignKey
ALTER TABLE "AvendorVendorQuote" ADD CONSTRAINT "AvendorVendorQuote_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "AvendorPaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
