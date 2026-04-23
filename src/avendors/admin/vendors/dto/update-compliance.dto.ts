import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AvendorComplianceStatus } from '@prisma/client';

export class UpdateComplianceDto {
  @ApiProperty({ enum: AvendorComplianceStatus, example: 'compliant' })
  @IsNotEmpty()
  @IsEnum(AvendorComplianceStatus)
  complianceStatus: AvendorComplianceStatus;
}
