import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryNoteDto {
  @IsNotEmpty()
  @IsString()
  driverName: string;

  @IsNotEmpty()
  @IsString()
  driverPhone: string;

  @IsNotEmpty()
  @IsString()
  vehicleNumber: string;

  @IsNotEmpty()
  @IsString()
  authorisedBy: string;

  @IsOptional()
  @IsString()
  note?: string;
}

