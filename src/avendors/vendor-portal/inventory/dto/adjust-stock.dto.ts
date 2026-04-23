import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum StockAdjustmentAction {
  increment = 'increment',
  decrement = 'decrement',
  set = 'set',
}

export class AdjustStockDto {
  @ApiProperty({ enum: StockAdjustmentAction, example: StockAdjustmentAction.increment })
  @IsEnum(StockAdjustmentAction)
  action: StockAdjustmentAction;

  @ApiProperty({
    example: 10,
    description:
      'For `increment` / `decrement`, the delta (must be >= 1). For `set`, the absolute target stock (>= 0).',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null ? value : Number(value),
  )
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ example: 'Restock after supplier delivery' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
