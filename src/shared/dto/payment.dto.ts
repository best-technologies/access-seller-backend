import { IsArray, IsNumber, IsString, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class PaymentDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];

  @IsNumber()
  paymentPercent: number;

  @IsNumber()
  payNow: number;

  @IsNumber()
  payLater: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  email?: string;
} 

export class affiliateInitiatePaystackPayment {
  @IsString()
  productId:string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  state?: string;

  @IsString()
  city: string;

  @IsString()
  houseAddress: string

  @IsString()
  fullShippingAddress: string

  @IsString()
  referralSlug?: string

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsNumber()
  quantity: number

  @IsNumber()
  totalAmount: number
} 

export class verifyPaystackPaymentDto {
    @IsString()
    @IsNotEmpty()
    reference: string;
}