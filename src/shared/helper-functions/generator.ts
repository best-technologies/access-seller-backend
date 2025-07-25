import { randomUUID } from 'crypto';

export function generateOrderId(): string {
  // Use UUID for high uniqueness, prefix for readability
  return `od/${randomUUID().replace(/-/g, '').slice(0, 7)}`;
}

export function generateTrackingId(): string {
  // Use UUID for high uniqueness, prefix for readability
  return `trk-${randomUUID().replace(/-/g, '').slice(0, 7)}`;
}

export function generatePayoutId() {
  return `out/acc${Math.random().toString(36).substring(2, 8)}`;
}
