import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Forward-only stage transitions the vendor is allowed to make from the
 * Order Fulfillment Timeline tab. `cancelled` is intentionally excluded —
 * only the A-Vendor admin may cancel an awarded order.
 */
export enum VendorFulfillmentStage {
  in_production = 'in_production',
  in_transit = 'in_transit',
  delivered = 'delivered',
}

export class UpdateVendorFulfillmentStageDto {
  @ApiProperty({
    enum: VendorFulfillmentStage,
    description:
      'The next stage to move the order into. Must be strictly forward of the current stage (e.g. `created` → `in_production`).',
    example: VendorFulfillmentStage.in_production,
  })
  @IsEnum(VendorFulfillmentStage)
  stage!: VendorFulfillmentStage;

  @ApiPropertyOptional({
    description:
      'Optional free-form note about this transition (e.g. tracking number, courier name).',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
