/*
  Warnings:

  - A unique constraint covering the columns `[paystackReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_paystackReference_key" ON "Order"("paystackReference");
