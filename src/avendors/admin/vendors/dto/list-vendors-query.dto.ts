import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { AvendorVendorStatus } from '@prisma/client';

export class ListVendorsQueryDto {
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

  @ApiPropertyOptional({ description: 'Case-insensitive search on vendor name or email' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({ enum: AvendorVendorStatus, description: 'Filter by vendor status' })
  @IsOptional()
  @IsEnum(AvendorVendorStatus)
  status?: AvendorVendorStatus;

  @ApiPropertyOptional({ enum: ['createdAt', 'name', 'totalOrders', 'totalSpend', 'rating'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' | 'totalOrders' | 'totalSpend' | 'rating';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
