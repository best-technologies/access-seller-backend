import type { PrismaService } from 'src/prisma/prisma.service';

/**
 * Business-friendly **public** supplier code in the shape `av-YYYY-XXX`.
 * Stored on `AvendorVendor.vendorCode`. The table PK `id` is a separate cuid.
 *
 * Admins do not pass this in; we generate it server-side and retry on the rare
 * collision so we always settle on a free code within the year's ~900-value pool.
 */
const CODE_MAX_ATTEMPTS = 30;

export function buildAvendorVendorCode(year: number = new Date().getFullYear()): string {
  const three = Math.floor(100 + Math.random() * 900);
  return `av-${year}-${three}`;
}

/**
 * Produces a unique `vendorCode` for a new `AvendorVendor` row.
 */
export async function generateUniqueAvendorVendorCode(
  prisma: PrismaService,
): Promise<string> {
  const year = new Date().getFullYear();
  let candidate = buildAvendorVendorCode(year);

  for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt++) {
    const exists = await prisma.avendorVendor.findFirst({
      where: { vendorCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = buildAvendorVendorCode(year);
  }

  return candidate;
}

/**
 * Resolves a route/admin reference that may be either the internal PK (`id`, cuid)
 * or the public `vendorCode` (`av-...`). Returns the internal `id` for DB FKs.
 */
export async function resolveAvendorVendorDbId(
  prisma: PrismaService,
  lookup: string,
): Promise<string | null> {
  const v = await prisma.avendorVendor.findFirst({
    where: { OR: [{ id: lookup }, { vendorCode: lookup }] },
    select: { id: true },
  });
  return v?.id ?? null;
}

