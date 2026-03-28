import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVendorNoteDto {
  @ApiProperty({ example: 'Vendor delivered late on last 3 orders' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
