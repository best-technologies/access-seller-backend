import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const toNumber = ({ value }: { value: any }) =>
  value === '' || value === undefined ? undefined : Number(value);

export class CreateMaterialDto {
  @ApiProperty({ example: 'A4 paper' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'ID of the AvendorMaterialCategory' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 'reams', default: 'pieces' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ example: 'Brief description of this material' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  stock?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 4200, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  pricePerUnit?: number;
}
