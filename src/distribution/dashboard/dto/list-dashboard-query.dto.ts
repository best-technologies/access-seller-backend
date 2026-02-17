import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ConsignmentStatus } from '@prisma/client';

export enum BulkOrderStatusEnum {
  pending = 'pending',
  confirmed = 'confirmed',
  packing = 'packing',
  completed = 'completed',
  cancelled = 'cancelled',
}

export class ListDashboardQueryDto {
  // Consignment pagination
  @IsOptional()
  consignmentPage?: number = 1;

  @IsOptional()
  consignmentLimit?: number = 20;

  // Bulk order pagination
  @IsOptional()
  bulkOrderPage?: number = 1;

  @IsOptional()
  bulkOrderLimit?: number = 20;

  // Consignment filters
  @IsOptional()
  @IsEnum(ConsignmentStatus)
  consignmentStatus?: ConsignmentStatus;

  @IsOptional()
  @IsString()
  consignmentSearch?: string;

  @IsOptional()
  @IsString()
  consignmentReferenceNumber?: string;

  @IsOptional()
  @IsString()
  consignmentInvoiceNumber?: string;

  @IsOptional()
  @IsString()
  consignmentSupplierName?: string;

  @IsOptional()
  @IsString()
  consignmentFromDate?: string;

  @IsOptional()
  @IsString()
  consignmentToDate?: string;

  // Bulk order filters
  @IsOptional()
  @IsString()
  bulkOrderStatus?: BulkOrderStatusEnum | string;

  @IsOptional()
  @IsString()
  bulkOrderSearch?: string;

  @IsOptional()
  @IsString()
  bulkOrderReferenceNumber?: string;

  @IsOptional()
  @IsString()
  bulkOrderBuyerName?: string;

  @IsOptional()
  @IsString()
  bulkOrderInvoiceNumber?: string;

  // Shared date filters (applied to both)
  @IsOptional()
  @IsString()
  fromCreatedAt?: string;

  @IsOptional()
  @IsString()
  toCreatedAt?: string;

  // Sort
  @IsOptional()
  @IsString()
  consignmentSortBy?: 'createdAt' | 'deliveryDate' | 'referenceNumber' | 'overallTotalCost' | 'status';

  @IsOptional()
  @IsString()
  consignmentSortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  bulkOrderSortBy?: 'createdAt' | 'referenceNumber' | 'totalAmount' | 'status';

  @IsOptional()
  @IsString()
  bulkOrderSortOrder?: 'asc' | 'desc';
}
