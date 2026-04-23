import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadVendorDocumentDto {
  @ApiProperty({ example: 'TIN', description: 'Document type code (TIN, CAC, etc.)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  documentType: string;

  @ApiProperty({ example: 'Tax ID Certificate', description: 'Human-readable document label' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  label: string;
}
