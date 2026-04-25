import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Tabs mirror the Quotes History UI filter chips.
 *
 * - `all` — every submitted/awarded/rejected/withdrawn quote for the vendor.
 * - `awarded` — quotes marked `accepted` by the A-Vendor admin.
 * - `pending` — quotes still `submitted` and awaiting an admin decision.
 */
export enum VendorQuoteHistoryView {
  all = 'all',
  awarded = 'awarded',
  pending = 'pending',
}

export class ListVendorQuoteHistoryQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Case-insensitive search on the RFQ number, RFQ title, or quote number.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({
    enum: VendorQuoteHistoryView,
    default: VendorQuoteHistoryView.all,
    description:
      '`all` (default) shows every submitted quote; `awarded` only accepted quotes; `pending` only those still awaiting an admin decision.',
  })
  @IsOptional()
  @IsEnum(VendorQuoteHistoryView)
  view?: VendorQuoteHistoryView = VendorQuoteHistoryView.all;
}
