export const DEFAULT_INVOICE_TAX_RATE = 7.5;

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTaxAmount(subtotal: number, taxRate: number): number {
  return roundMoney((subtotal * taxRate) / 100);
}

export function resolveInvoiceTax(
  subtotal: number,
  dtoTaxRate?: number,
  dtoTaxAmount?: number,
): { taxRate: number | null; taxAmount: number } {
  const roundedSubtotal = roundMoney(subtotal);

  if (dtoTaxRate != null) {
    const taxRate = dtoTaxRate;
    const taxAmount = computeTaxAmount(roundedSubtotal, taxRate);

    if (dtoTaxAmount != null && Math.abs(dtoTaxAmount - taxAmount) > 0.01) {
      throw new Error(
        `Tax amount ${dtoTaxAmount} does not match computed amount ${taxAmount} for rate ${taxRate}%`,
      );
    }

    return { taxRate, taxAmount };
  }

  if (dtoTaxAmount != null) {
    return { taxRate: null, taxAmount: roundMoney(dtoTaxAmount) };
  }

  const taxRate = DEFAULT_INVOICE_TAX_RATE;
  return {
    taxRate,
    taxAmount: computeTaxAmount(roundedSubtotal, taxRate),
  };
}
