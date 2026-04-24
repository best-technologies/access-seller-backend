import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

/**
 * Set or clear the preferred `AvendorPaymentPlan` on a vendor quote
 * (A-Vendor backoffice and supplier portal; last writer recorded in `paymentPlanSetBy`).
 */
export class SetVendorQuotePaymentPlanBodyDto {
  @ApiProperty({
    description: 'Active catalog plan id, or `null` to clear the selection.',
    nullable: true,
  })
  @ValidateIf((_, v) => v != null)
  @IsString()
  @IsNotEmpty()
  paymentPlanId: string | null;
}
