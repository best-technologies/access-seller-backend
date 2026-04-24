import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export enum VendorQuoteRequestView {
  /// RFQs the vendor has not yet quoted on (status sent / awaiting_selection, no quote or withdrawn).
  open = 'open',
  /// RFQs where the vendor has a live `submitted` quote awaiting admin decision.
  submitted = 'submitted',
  /// Everything open + submitted (useful for a single combined list).
  active = 'active',
}

export class ListVendorQuoteRequestsQueryDto {
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

  @ApiPropertyOptional({ description: 'Case-insensitive search on title or RFQ number' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({
    enum: VendorQuoteRequestView,
    default: VendorQuoteRequestView.active,
    description:
      '`open` = not yet quoted; `submitted` = quote already sent; `active` = both (default).',
  })
  @IsOptional()
  @IsEnum(VendorQuoteRequestView)
  view?: VendorQuoteRequestView = VendorQuoteRequestView.active;
}
