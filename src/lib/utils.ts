import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a number as Nigerian Naira currency (₦)
export function formatAmount(amount: number) {
  return amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Strips all HTML tags from a string and trims whitespace and newlines
export function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\\n|\\r|\\t/g, ' ') // Remove escaped newlines, carriage returns, tabs
    .replace(/[\n\r\t]/g, ' ') // Remove actual newlines, carriage returns, tabs
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}
