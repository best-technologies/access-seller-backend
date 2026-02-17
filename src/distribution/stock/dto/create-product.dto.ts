import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Transforms for multipart form data (strings from form fields)
const toNumber = ({ value }: { value: any }) =>
  value === '' || value === undefined ? undefined : Number(value);
const toBoolean = ({ value }: { value: any }) =>
  value === undefined || value === '' ? true : value === 'true' || value === true;

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  initialStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  normalSellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  discountedSellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  warehouseLocation?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isActive?: boolean;
}
