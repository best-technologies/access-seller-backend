import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? undefined : String(value).trim();

export class UploadComplianceDocumentDto {
  @ApiProperty({ example: 'TIN', description: 'Document type code (e.g. TIN, CAC, VAT).' })
  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  documentType: string;

  @ApiProperty({ example: 'Tax ID Certificate', description: 'Human-readable label.' })
  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({
    description: 'Expiry date (ISO 8601). Compliance docs without expiry may omit.',
    example: '2026-12-31',
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim();
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateComplianceDocumentDto {
  @ApiPropertyOptional({ example: 'CAC' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentType?: string;

  @ApiPropertyOptional({ example: 'Certificate of Incorporation' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim();
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
