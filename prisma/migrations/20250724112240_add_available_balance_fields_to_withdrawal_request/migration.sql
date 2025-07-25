/*
  Warnings:

  - You are about to drop the column `awaiting_approval` on the `Wallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "awaiting_approval",
ADD COLUMN     "commission_awaiting_approval" DOUBLE PRECISION DEFAULT 0;
