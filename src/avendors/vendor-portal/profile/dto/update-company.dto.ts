import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trimOrNull = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === '' ? null : s;
};

export class UpdateVendorCompanyDto {
  @ApiPropertyOptional({ example: 'Global Supplies Ltd' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Industrial Equipment' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string | null;

  @ApiPropertyOptional({ example: '+2348161252897' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({ example: '12 Adeola Odeku Street' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional({ example: 'Lagos' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string | null;
}
