import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommissionReferralConfigDto {
  @ApiProperty({
    description: 'Minimum purchase amount (naira) for this commission band',
    example: 1_000,
  })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiPropertyOptional({
    description:
      'Maximum purchase amount (naira) for this band. Leave empty/null to represent "and above".',
    example: 10_000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiProperty({
    description: 'Commission percentage for this band (must be non-decreasing across bands)',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  percentage: number;
}

