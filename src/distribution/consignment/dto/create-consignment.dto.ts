import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** Per-item fields */
export class ConsignmentItemDto {
  @IsOptional()
  @IsString()
  productId?: string; // Select from stock catalog; if set, productName/sku copied from product

  @IsOptional()
  @IsString()
  productName?: string; // Required when productId not set

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsNumber()
  @Min(0)
  cartons: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;  // Computed as qty × unitPrice if omitted

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateConsignmentDto {
  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @IsNotEmpty()
  @IsString()
  supplierName: string;

  @IsOptional()
  @IsString()
  supplierReference?: string;

  // Sales person
  @IsOptional()
  @IsString()
  salesPersonName?: string;

  @IsOptional()
  @IsString()
  salesPersonPhone?: string;

  @IsOptional()
  @IsEmail()
  salesPersonEmail?: string;

  // Invoice & delivery
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string; // "HH:mm"

  @IsOptional()
  @IsString()
  paymentModeTerms?: string;

  @IsOptional()
  @IsString()
  manufacturerOrderNumber?: string;

  @IsOptional()
  @IsString()
  dispatchDocumentNumber?: string;

  // Overall totals (can be computed from items if omitted)
  @IsOptional()
  @IsNumber()
  @Min(0)
  overallTotalCartons?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overallTotalQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overallTotalCost?: number;

  // Bank account paid to manufacturer
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPaid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceToPay?: number;

  @IsOptional()
  @IsString()
  amountToPayInWords?: string;

  @IsOptional()
  @IsString()
  amountPaidInWords?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  warehouseLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsignmentItemDto)
  items?: ConsignmentItemDto[];
}
