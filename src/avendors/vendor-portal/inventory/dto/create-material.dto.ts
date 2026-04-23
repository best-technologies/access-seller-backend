import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const toNumber = ({ value }: { value: any }) => {
  if (value === '' || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
};

export class CreateVendorInventoryMaterialDto {
  @ApiProperty({ example: 'A4 Printing Paper' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'ID of a category belonging to the current vendor',
    example: 'clx3c2f4a0001abcd1234efgh',
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'reams', description: 'Unit of measure' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiPropertyOptional({
    description:
      'Optional stock keeping unit. If omitted, a unique SKU like `OFF-001` is generated from the category prefix.',
    example: 'OFF-001',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]{2,5}-\d{1,6}$/, {
    message:
      'sku must look like `XXX-123` (2–5 letters/digits, dash, 1–6 digits)',
  })
  sku?: string;

  @ApiPropertyOptional({
    example: 'Brief description of this material…',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 4200, default: 0 })
  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;
}
