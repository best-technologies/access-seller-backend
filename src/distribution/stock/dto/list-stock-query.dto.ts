import { IsOptional, IsString } from 'class-validator';

export class ListStockQueryDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  isActive?: 'true' | 'false';

  @IsOptional()
  @IsString()
  lowStock?: 'true'; // Filter products where currentStock <= reorderLevel

  @IsOptional()
  @IsString()
  fromCreatedAt?: string;

  @IsOptional()
  @IsString()
  toCreatedAt?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' | 'sku' | 'currentStock' | 'costPrice' | 'category';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
