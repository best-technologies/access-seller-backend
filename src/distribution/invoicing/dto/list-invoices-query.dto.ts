import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class ListInvoicesQueryDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  fromIssueDate?: string;

  @IsOptional()
  @IsString()
  toIssueDate?: string;

  @IsOptional()
  @IsString()
  fromCreatedAt?: string;

  @IsOptional()
  @IsString()
  toCreatedAt?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'issueDate' | 'dueDate' | 'invoiceNumber' | 'totalAmount' | 'status';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
