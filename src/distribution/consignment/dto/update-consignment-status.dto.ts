import { IsEnum } from 'class-validator';
import { ConsignmentStatus } from '@prisma/client';

export class UpdateConsignmentStatusDto {
  @IsEnum(ConsignmentStatus)
  status: ConsignmentStatus;
}
