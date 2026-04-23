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

export enum VendorInventoryStockStatus {
  in_stock = 'in_stock',
  low_stock = 'low_stock',
  out_of_stock = 'out_of_stock',
}

export enum VendorInventoryMaterialSortBy {
  createdAt = 'createdAt',
  name = 'name',
  sku = 'sku',
  stock = 'stock',
  pricePerUnit = 'pricePerUnit',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class ListVendorInventoryMaterialsQueryDto {
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
    description: 'Case-insensitive search on SKU, name or description',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter materials to a single vendor-owned category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: VendorInventoryStockStatus,
    description:
      'Stock-status tab. `in_stock` = stock > reorderLevel, `low_stock` = 0 < stock <= reorderLevel, `out_of_stock` = stock = 0.',
  })
  @IsOptional()
  @IsEnum(VendorInventoryStockStatus)
  status?: VendorInventoryStockStatus;

  @ApiPropertyOptional({
    enum: VendorInventoryMaterialSortBy,
    default: VendorInventoryMaterialSortBy.createdAt,
  })
  @IsOptional()
  @IsEnum(VendorInventoryMaterialSortBy)
  sortBy?: VendorInventoryMaterialSortBy;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
