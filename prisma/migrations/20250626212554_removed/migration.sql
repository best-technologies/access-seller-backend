/*
  Warnings:

  - You are about to drop the column `storeId` on the `Category` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_name_storeId_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "storeId";
