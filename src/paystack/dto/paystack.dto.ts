import { IsNotEmpty, IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsEmail, IsIn } from "class-validator";
import { Type } from 'class-transformer';

export class VerifyAccountNumberDto {
    @IsString()
    @IsNotEmpty()
    account_number: string;
    
    @IsString()
    @IsNotEmpty()
    bank_code: string;
}

// Cart Checkout DTOs
export class CartOrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  subtotal: number;

  @IsString()
  category: string;
}

export class PartialPaymentDto {
  @IsNumber()
  allowedPercentage: number;

  @IsNumber()
  selectedPercentage: number;

  @IsNumber()
  payNow: number;

  @IsNumber()
  payLater: number;

  @IsNumber()
  toBalance: number;
}

export class FullPaymentDto {
  @IsNumber()
  total: number;

  @IsNumber()
  payNow: number;

  @IsNumber()
  payLater: number;
}

export class ShippingInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  houseAddress?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsIn(['pickup-depot', 'pickup-park', 'doorstep'])
  shippingMethod: 'pickup-depot' | 'pickup-park' | 'doorstep';

  @IsString()
  @IsOptional()
  selectedDepotId?: string;

  // Fields for pickup-park
  @IsString()
  @IsOptional()
  parkLocation?: string;

  @IsString()
  @IsOptional()
  pickupDate?: string;

  // Fields for doorstep delivery
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}

export class CheckoutFromCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartOrderItemDto)
  items: CartOrderItemDto[];

  @IsNumber()
  totalItems: number;

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pickup-depot', 'pickup-park', 'doorstep'])
  shippingMethod?: 'pickup-depot' | 'pickup-park' | 'doorstep';

  @IsString()
  @IsOptional()
  selectedDepotId?: string;

  @IsOptional()
  @IsString()
  referralCode?: string | null;

  @IsOptional()
  @IsNumber()
  referralDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  referralDiscountAmount?: number;

  @IsOptional()
  @IsString()
  promoCode?: string | null;

  @IsOptional()
  @IsNumber()
  promoDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  promoDiscountAmount?: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  shipping: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialPaymentDto)
  partialPayment?: PartialPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FullPaymentDto)
  fullPayment?: FullPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo?: ShippingInfoDto;

  @IsOptional()
  @IsString()
  shippingAddressId?: string;
}