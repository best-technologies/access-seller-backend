import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency amount
 * 
 * @param amount - The amount to format (number, string, undefined, or null)
 * @param options - Formatting options
 * @param options.currency - Currency code (default: "NGN")
 * @param options.locale - Locale for formatting (default: "en-NG")
 * @param options.minimumFractionDigits - Minimum decimal places (default: 0)
 * @param options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @param options.showCurrency - Whether to show currency symbol (default: true)
 * @param options.compact - Whether to use compact notation for large numbers (default: false)
 * 
 * @returns Formatted currency string
 * 
 * @example
 * // Basic usage
 * formatAmount(1500) // "₦1,500"
 * formatAmount(1500.50) // "₦1,500.50"
 * 
 * // Without currency symbol
 * formatAmount(1500, { showCurrency: false }) // "1,500"
 * 
 * // Compact format for large numbers
 * formatAmount(1500000, { compact: true }) // "₦1.5M"
 * formatAmount(1500, { compact: true }) // "₦1,500" (no compact for small numbers)
 * 
 * // Custom decimal places
 * formatAmount(1500.123, { maximumFractionDigits: 3 }) // "₦1,500.123"
 * 
 * // Handle invalid inputs
 * formatAmount(null) // "₦0"
 * formatAmount(undefined) // "₦0"
 * formatAmount("invalid") // "₦0"
 */
export function formatAmount(
  amount: number | string | undefined | null,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): string {
  // Default options
  const {
    currency = "NGN",
    locale = "en-NG",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showCurrency = true,
    compact = false,
  } = options;

  // Handle invalid inputs
  if (amount === null || amount === undefined || amount === "") {
    return showCurrency ? "₦0" : "0";
  }

  // Convert to number
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numericAmount)) {
    return showCurrency ? "₦0" : "0";
  }

  try {
    if (compact && numericAmount >= 1000) {
      // Compact format for large numbers (e.g., 1.5K, 2.3M)
      const formatter = new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
      });
      const formatted = formatter.format(numericAmount);
      return showCurrency ? `₦${formatted}` : formatted;
    } else {
      // Standard format
      const formatter = new Intl.NumberFormat(locale, {
        style: showCurrency ? "currency" : "decimal",
        currency: showCurrency ? currency : undefined,
        minimumFractionDigits,
        maximumFractionDigits,
      });
      return formatter.format(numericAmount);
    }
  } catch (_error) {

    console.log(_error)
    // Fallback formatting
    const formatted = numericAmount.toLocaleString(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return showCurrency ? `₦${formatted}` : formatted;
  }
}

/**
 * Formats a number as Nigerian Naira (₦)
 * @param amount - The amount to format
 * @param options - Additional formatting options
 * @returns Formatted Naira string
 */
export function formatNaira(
  amount: number | string | undefined | null,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): string {
  return formatAmount(amount, {
    currency: "NGN",
    locale: "en-NG",
    ...options,
  });
}

/**
 * Formats a number as a compact currency (e.g., ₦1.5K, ₦2.3M)
 * @param amount - The amount to format
 * @param options - Additional formatting options
 * @returns Compact formatted currency string
 */
export function formatCompactAmount(
  amount: number | string | undefined | null,
  options: {
    currency?: string;
    locale?: string;
    showCurrency?: boolean;
  } = {}
): string {
  return formatAmount(amount, {
    compact: true,
    ...options,
  });
}
