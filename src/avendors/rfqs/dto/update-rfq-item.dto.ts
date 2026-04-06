import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRfqItemDto {
  @ApiPropertyOptional({ description: 'Switch to a different AvendorMaterial', example: 'clxyz1234567890' })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({ example: 500, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 400000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budget?: number;

  @ApiPropertyOptional({ example: 'Updated specs: must be 80gsm white' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
