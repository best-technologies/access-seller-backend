-- DeliveryNote was likely created with `prisma db push` (DB-generated id + timestamptz-style columns).
-- Migration replay used TIMESTAMP(3) and no DB defaults on id/updatedAt (same pattern as Invoice).
-- Align Neon (and any env) with that shape so `migrate dev` drift checks pass.

ALTER TABLE "DeliveryNote" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "DeliveryNote" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "DeliveryNote" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3)
  USING ("createdAt"::timestamp(3));

ALTER TABLE "DeliveryNote" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3)
  USING ("updatedAt"::timestamp(3));
