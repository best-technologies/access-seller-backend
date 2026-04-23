import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVendorInventoryCategoryDto {
  @ApiProperty({ example: 'Office Supplies' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({
    example: 'Consumables and stationery for day-to-day operations.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Optional 2–5 character SKU prefix (uppercase letters only). Auto-generated from the name if omitted. Used when auto-assigning SKUs like `OFF-001`.',
    example: 'OFF',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2,5}$/, {
    message: 'skuPrefix must be 2–5 uppercase letters (A–Z)',
  })
  skuPrefix?: string;
}
