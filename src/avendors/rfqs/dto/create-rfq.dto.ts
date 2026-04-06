import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRfqItemDto {
  @ApiProperty({ description: 'ID of an existing AvendorMaterial', example: 'clxyz1234567890' })
  @IsNotEmpty()
  @IsString()
  materialId: string;

  @ApiProperty({ example: 1000, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 750000, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budget?: number;

  @ApiPropertyOptional({ example: 'Must be 80gsm white, A4 size' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreateRfqDto {
  @ApiProperty({ example: 'Textbook production' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: '2026-04-15T00:00:00.000Z', description: 'ISO 8601 date string' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Need materials for Q2 textbook run' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: [CreateRfqItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRfqItemDto)
  items: CreateRfqItemDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Vendor IDs to assign to this RFQ',
    example: ['clxyz1234567890'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendorIds?: string[];

  @ApiPropertyOptional({
    description: 'If true, assigns all active vendors instead of vendorIds',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendToAllVendors?: boolean;
}
