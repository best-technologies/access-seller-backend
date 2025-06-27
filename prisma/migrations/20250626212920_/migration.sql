/*
  Warnings:

  - A unique constraint covering the columns `[name,storeId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "storeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_storeId_key" ON "Category"("name", "storeId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
