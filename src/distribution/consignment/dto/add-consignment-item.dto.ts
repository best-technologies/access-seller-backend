import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddConsignmentItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string; // Required: select from stock catalog (GET /distribution/stock/search?q=...)

  @IsOptional()
  @IsString()
  productName?: string; // Filled from product; optional override

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsNumber()
  @Min(0)
  cartons: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retailPrice?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
