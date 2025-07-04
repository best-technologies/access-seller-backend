-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'paid', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "commissionId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "totalPurchaseAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "commissionPercentage" TEXT NOT NULL,
    "payoutMethod" TEXT NOT NULL,
    "bankId" TEXT,
    "payoutStatus" "WithdrawalStatus" NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_reference_key" ON "WithdrawalRequest"("reference");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_orderId_idx" ON "WithdrawalRequest"("orderId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_payoutStatus_idx" ON "WithdrawalRequest"("payoutStatus");

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
