import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum PayoutMethod {
  BANK = 'bank',
  WALLET = 'wallet',
  PAYPAL = 'paypal'
}

export class RequestWithdrawalNewDto {
  @IsNotEmpty()
  @IsNumber()
  amount: string;

  @IsOptional()
  @IsString()
  bankCode?: string; // Required if payoutMethod is 'bank'

  @IsOptional()
  @IsString()
  orderId?: string;
} 