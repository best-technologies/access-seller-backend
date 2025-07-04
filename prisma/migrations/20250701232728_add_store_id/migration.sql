/*
  Warnings:

  - A unique constraint covering the columns `[bankCode]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bank_bankCode_key" ON "Bank"("bankCode");
