import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { CreateVendorDto, CreateVendorPortalUserDto } from './create-vendor.dto';

const toNumber = ({ value }: { value: any }) =>
  value === '' || value === undefined ? undefined : Number(value);

/** Partial `user` for PATCH (may update only one of first_name / last_name / username). */
export class UpdateVendorPortalUserDto extends PartialType(
  CreateVendorPortalUserDto,
) {}

class UpdateVendorBase extends PartialType(
  OmitType(CreateVendorDto, ['user'] as const),
) {
  @ApiPropertyOptional({ type: UpdateVendorPortalUserDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVendorPortalUserDto)
  user?: UpdateVendorPortalUserDto;
}

export class UpdateVendorDto extends UpdateVendorBase {
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
