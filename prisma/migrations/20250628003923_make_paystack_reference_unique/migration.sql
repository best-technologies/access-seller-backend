/*
  Warnings:

  - Added the required column `commissionPercentage` to the `Commission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPurchaseAmount` to the `Commission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "commissionPercentage" TEXT NOT NULL,
ADD COLUMN     "totalPurchaseAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "productid" TEXT;
