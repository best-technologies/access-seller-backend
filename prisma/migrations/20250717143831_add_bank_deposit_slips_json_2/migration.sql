-- CreateEnum
CREATE TYPE "OrderPaymentmethod" AS ENUM ('paystack', 'bank_deposit');

-- AlterEnum
ALTER TYPE "ShipmentStatus" ADD VALUE 'awaiting_verification';

-- AlterEnum
ALTER TYPE "orderPaymentStatus" ADD VALUE 'awaiting_verification';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "OrderPaymentmethod" DEFAULT 'paystack';
