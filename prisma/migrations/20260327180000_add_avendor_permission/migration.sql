-- CreateEnum
CREATE TYPE "AvendorModuleAccessLevel" AS ENUM ('full_access', 'view_only', 'no_access');

-- CreateTable
CREATE TABLE "AvendorPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendors_management" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "inventory" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "rfqs" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "order_management" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "invoice" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "payment" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "onboarding" "AvendorModuleAccessLevel" NOT NULL DEFAULT 'view_only',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvendorPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvendorPermission_userId_key" ON "AvendorPermission"("userId");

-- AddForeignKey
ALTER TABLE "AvendorPermission" ADD CONSTRAINT "AvendorPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
