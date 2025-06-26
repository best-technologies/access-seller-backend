export class RequestCommissionPayoutDto {
  amount: number;
  method: string; // e.g. 'bank', 'wallet', etc.
}

export class CommissionPayoutResponseDto {
  payout_id: string;
  amount: number;
  status: string;
  method: string;
  reference: string;
  requestedAt: Date;
  paidAt?: Date | null;
} 