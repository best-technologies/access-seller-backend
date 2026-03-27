import { AllowedPlatformTypeForAdmin } from '@prisma/client';

/**
 * Public API / client values (hyphenated). Stored in DB as {@link AllowedPlatformTypeForAdmin}.
 */
export const ALLOWED_PLATFORM_API_VALUES = [
  'access-seller',
  'btech-electronics',
  'avendor',
] as const;

export type AllowedPlatformApiValue = (typeof ALLOWED_PLATFORM_API_VALUES)[number];

const API_TO_PRISMA: Record<AllowedPlatformApiValue, AllowedPlatformTypeForAdmin> = {
  'access-seller': AllowedPlatformTypeForAdmin.access_seller,
  'btech-electronics': AllowedPlatformTypeForAdmin.btech_electronics,
  avendor: AllowedPlatformTypeForAdmin.avendor,
};

const PRISMA_TO_API: Record<AllowedPlatformTypeForAdmin, AllowedPlatformApiValue> = {
  [AllowedPlatformTypeForAdmin.access_seller]: 'access-seller',
  [AllowedPlatformTypeForAdmin.btech_electronics]: 'btech-electronics',
  [AllowedPlatformTypeForAdmin.avendor]: 'avendor',
};

export function mapApiPlatformsToPrisma(
  values: AllowedPlatformApiValue[],
): AllowedPlatformTypeForAdmin[] {
  return values.map((v) => API_TO_PRISMA[v]);
}

export function mapPrismaPlatformsToApi(
  values: AllowedPlatformTypeForAdmin[],
): AllowedPlatformApiValue[] {
  return values.map((v) => PRISMA_TO_API[v]);
}
