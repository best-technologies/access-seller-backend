import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantity: number; // Positive = add, negative = reduce

  @IsOptional()
  @IsString()
  reason?: string;
}
