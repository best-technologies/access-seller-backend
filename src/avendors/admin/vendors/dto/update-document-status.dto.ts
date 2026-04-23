import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AvendorDocumentStatus } from '@prisma/client';

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: AvendorDocumentStatus, example: 'valid' })
  @IsNotEmpty()
  @IsEnum(AvendorDocumentStatus)
  status: AvendorDocumentStatus;
}
