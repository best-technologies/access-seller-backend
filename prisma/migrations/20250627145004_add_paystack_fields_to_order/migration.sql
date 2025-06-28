-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paystackAccessCode" TEXT,
ADD COLUMN     "paystackAuthorizationUrl" TEXT,
ADD COLUMN     "paystackReference" TEXT;
