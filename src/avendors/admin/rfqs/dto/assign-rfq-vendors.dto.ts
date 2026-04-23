import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRfqVendorsDto {
  @ApiProperty({
    type: [String],
    description: 'Vendor IDs to assign (ignored when sendToAllVendors is true)',
    example: ['clxyz1234567890'],
  })
  @IsArray()
  @IsString({ each: true })
  vendorIds: string[];

  @ApiPropertyOptional({
    description: 'If true, assigns all active vendors instead of vendorIds',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendToAllVendors?: boolean;
}
