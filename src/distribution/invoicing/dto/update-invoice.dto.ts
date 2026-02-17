import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;

  @IsOptional()
  @IsString()
  managerSignedBy?: string;

  @IsOptional()
  @IsDateString()
  managerSignedAt?: string;

  @IsOptional()
  @IsString()
  customerSignedBy?: string;

  @IsOptional()
  @IsDateString()
  customerSignedAt?: string;
}
