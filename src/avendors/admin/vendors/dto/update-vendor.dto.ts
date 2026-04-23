import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateVendorDto } from './create-vendor.dto';

const toNumber = ({ value }: { value: any }) =>
  value === '' || value === undefined ? undefined : Number(value);

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  rating?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  totalOrders?: number;

  @ApiPropertyOptional({ example: 6750000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  totalSpend?: number;
}
