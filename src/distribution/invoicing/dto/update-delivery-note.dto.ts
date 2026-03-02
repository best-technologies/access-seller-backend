import { IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryNoteDto {
  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  authorisedBy?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

