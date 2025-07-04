import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum PayoutMethod {
  BANK = 'bank',
  WALLET = 'wallet',
  PAYPAL = 'paypal'
}

export class RequestWithdrawalDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  bankCode?: string; // Required if payoutMethod is 'bank'
} 