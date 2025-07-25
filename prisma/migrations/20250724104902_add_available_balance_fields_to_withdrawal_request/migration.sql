/*
  Warnings:

  - You are about to drop the column `availableAfter` on the `WithdrawalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `availableBefore` on the `WithdrawalRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WithdrawalRequest" DROP COLUMN "availableAfter",
DROP COLUMN "availableBefore",
ADD COLUMN     "availableBalanceAfter" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "availableBalanceBefore" DOUBLE PRECISION DEFAULT 0;
