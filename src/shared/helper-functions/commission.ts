export function calculateAffiliateCommissionPercentage(totalPurchaseAmount: number): number {
  const amount = Number(totalPurchaseAmount) || 0;
  if (amount >= 501_000) return 15; // N501,000 and above => 15%
  if (amount >= 201_000) return 10; // N201,000 – N500,000 => 10%
  return 5; // N1,000 – N200,000 (and below) => 5%
}

export function calculateReferralScheduleDiscountPercent(options: {
  saleDiscountPercent?: number; // e.g., 20 or 10
  isCollectionCenter?: boolean;
}): number {
  const { saleDiscountPercent, isCollectionCenter } = options || {};
  if (isCollectionCenter) return 5; // Collection Center; 5%

  const discount = Number(saleDiscountPercent);
  if (discount === 20) return 2; // For 20% sales: 2% for referral
  if (discount === 10) return 5; // For 10% sales: 5% for referral

  return 0; // default when no matching schedule
}

export const collectionCenterDiscount = 5;


