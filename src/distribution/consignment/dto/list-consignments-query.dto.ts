import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsignmentStatus } from '@prisma/client';

export class ListConsignmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ConsignmentStatus)
  status?: ConsignmentStatus;

  /** Search across referenceNumber, invoiceNumber, supplierName, deliveryNote, manufacturerOrderNumber, dispatchDocumentNumber, salesPersonName */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter by reference number (exact or contains) */
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  /** Filter by invoice number */
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  /** Filter by supplier/manufacturer name */
  @IsOptional()
  @IsString()
  supplierName?: string;

  /** Filter by delivery date from (ISO date) */
  @IsOptional()
  @IsString()
  fromDate?: string;

  /** Filter by delivery date to (ISO date) */
  @IsOptional()
  @IsString()
  toDate?: string;

  /** Filter by created date from (ISO date) */
  @IsOptional()
  @IsString()
  fromCreatedAt?: string;

  /** Filter by created date to (ISO date) */
  @IsOptional()
  @IsString()
  toCreatedAt?: string;

  /** Sort field: createdAt, deliveryDate, referenceNumber, overallTotalCost, status */
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'deliveryDate' | 'referenceNumber' | 'overallTotalCost' | 'status' = 'createdAt';

  /** Sort order */
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
