import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertVendorPortalBankDto {
  @ApiProperty({ example: 'First Bank Nigeria' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  bankName: string;

  @ApiProperty({ example: '2033445566' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  accountNumber: string;

  @ApiProperty({ example: 'Dangote Industries Ltd' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  accountName: string;
}
