/*
  Warnings:

  - Made the column `normalPrice` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "normalPrice" SET NOT NULL;
