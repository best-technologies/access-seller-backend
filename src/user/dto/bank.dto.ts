import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AddBankDto {
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  bankCode: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  accountName: string;
}

export class DeleteBankDto {
  @IsNotEmpty()
  @IsString()
  bankId: string;
}

export class UpdateBankStatusDto {
  @IsNotEmpty()
  @IsString()
  bankId: string;

  @IsNotEmpty()
  isActive: boolean;
} 