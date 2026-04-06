import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRfqDto {
  @ApiPropertyOptional({ example: 'Textbook production - revised' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Updated requirements for Q2' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
