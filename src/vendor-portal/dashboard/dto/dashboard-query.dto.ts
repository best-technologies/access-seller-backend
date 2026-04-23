import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Number of recent quote requests to return (1–20).',
    example: 5,
  })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  recentQuoteLimit?: number;
}
