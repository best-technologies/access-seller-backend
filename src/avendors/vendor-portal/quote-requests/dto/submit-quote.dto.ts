import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const toNumber = ({ value }: { value: any }) => {
  if (value === '' || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
};

export class SubmitQuoteLineDto {
  @ApiProperty({
    description: 'RFQ item id this price option is for. Must belong to the RFQ being quoted.',
    example: 'clx7z8i2j0001cdef1234mnop',
  })
  @IsString()
  @IsNotEmpty()
  rfqItemId: string;

  @ApiPropertyOptional({
    description: '0-based display order within this RFQ item.',
    example: 0,
  })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    example: '100%',
    description: 'Free-form quality tier (e.g. "100%", "Grade A", "80 GSM uncoated").',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quality?: string;

  @ApiPropertyOptional({
    example: '2026-02-19',
    description: 'ISO 8601 date you commit to deliver by.',
  })
  @IsOptional()
  @IsDateString()
  possibleDeliveryAt?: string;

  @ApiProperty({ example: 750, description: 'Price per unit in the quote currency.' })
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiPropertyOptional({
    example: 750000,
    description:
      'Total price for the line. If omitted, server uses `pricePerUnit × rfqItem.quantity`.',
  })
  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({
    example: 'Bulk discount available for >1000 units.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class SubmitVendorQuoteDto {
  @ApiProperty({
    description:
      'One entry per price option. A vendor can include multiple lines for the same `rfqItemId` (quality tiers).',
    type: [SubmitQuoteLineDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitQuoteLineDto)
  lines: SubmitQuoteLineDto[];

  @ApiPropertyOptional({
    example: 'All prices VAT-inclusive. Lead time starts from PO confirmation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    example: 'NGN',
    default: 'NGN',
    description: 'ISO-4217 code. Only NGN is active in the current environment.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({
    description:
      'Active catalog `payment plan` id (see `GET /vendor/quote-requests/payment-plans`). ' +
      'On first submit: omit for no plan. On resubmit: omit to keep the current plan, ' +
      'set to a new id to change, or set to `null` to clear.',
    nullable: true,
    example: 'clx3paymentplan1',
  })
  @IsOptional()
  @ValidateIf((o) => o.paymentPlanId !== null && o.paymentPlanId !== undefined)
  @IsString()
  @IsNotEmpty()
  paymentPlanId?: string | null;
}
