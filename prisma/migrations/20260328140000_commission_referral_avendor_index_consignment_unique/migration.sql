-- CommissionReferralConfig (schema model)
CREATE TABLE IF NOT EXISTS "CommissionReferralConfig" (
    "id" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionReferralConfig_pkey" PRIMARY KEY ("id")
);

-- @@index([userId]) on AvendorPermission (table created in 20260327180000)
CREATE INDEX IF NOT EXISTS "AvendorPermission_userId_idx" ON "AvendorPermission"("userId");

-- Legacy partial unique index from 20250215050000 conflicts with Prisma @unique on nullable field.
DROP INDEX IF EXISTS "Consignment_invoiceNumber_key";
CREATE UNIQUE INDEX "Consignment_invoiceNumber_key" ON "Consignment"("invoiceNumber");
