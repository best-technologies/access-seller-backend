import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Raw materials', description: 'Category name (unique)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Brief description of this category' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
