import { IsNumber, IsOptional, Min } from 'class-validator';

export class MarkInvoicePaidDto {
  /**
   * Amount paid. If omitted, treats as full payment (amountPaid = totalAmount).
   * Stock is reduced only when the invoice becomes fully paid (balanceDue = 0).
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;
}
