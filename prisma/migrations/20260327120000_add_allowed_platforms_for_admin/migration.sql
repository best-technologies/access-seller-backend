-- CreateEnum
CREATE TYPE "AllowedPlatformTypeForAdmin" AS ENUM ('access_seller', 'btech_electronics', 'avendor');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "allowedPlatformsForAdmin" "AllowedPlatformTypeForAdmin"[] NOT NULL DEFAULT ARRAY[]::"AllowedPlatformTypeForAdmin"[];
