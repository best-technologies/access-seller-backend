import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddConsignmentItemDto {
  @IsOptional()
  @IsString()
  productId?: string; // Select from stock catalog; if set, productName/sku copied from product

  @ValidateIf((o) => !o.productId)
  @IsString()
  productName?: string; // Required when productId not set

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
  @IsString()
  condition?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
