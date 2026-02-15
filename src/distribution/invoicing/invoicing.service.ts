import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: ListInvoicesQueryDto): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status as InvoiceStatus;
    if (query.invoiceNumber) {
      where.invoiceNumber = { contains: query.invoiceNumber, mode: 'insensitive' };
    }
    if (query.customerName) {
      where.customerName = { contains: query.customerName, mode: 'insensitive' };
    }
    if (query.fromIssueDate || query.toIssueDate) {
      where.issueDate = {};
      if (query.fromIssueDate) where.issueDate.gte = new Date(query.fromIssueDate);
      if (query.toIssueDate) where.issueDate.lte = new Date(query.toIssueDate);
    }
    if (query.fromCreatedAt || query.toCreatedAt) {
      where.createdAt = {};
      if (query.fromCreatedAt) where.createdAt.gte = new Date(query.fromCreatedAt);
      if (query.toCreatedAt) where.createdAt.lte = new Date(query.toCreatedAt);
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      const searchMode = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { invoiceNumber: searchMode },
        { customerName: searchMode },
        { customerCompany: searchMode },
      ];
    }
    return where;
  }

  async findAll(query: ListInvoicesQueryDto) {
    const page = typeof query.page === 'number' ? query.page : Math.max(1, parseInt(String(query.page), 10) || 1);
    const limit = typeof query.limit === 'number' ? query.limit : Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 20));
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const validSort = ['createdAt', 'issueDate', 'dueDate', 'invoiceNumber', 'totalAmount', 'status'] as const;
    const sortBy = validSort.includes(query.sortBy as any) ? (query.sortBy as (typeof validSort)[number]) : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const orderBy = { [sortBy as string]: sortOrder } as Prisma.InvoiceOrderByWithRelationInput;

    const [items, total, allForAnalysis] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy,
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: { items: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const analysis = this.computeAnalysis(allForAnalysis);

    const payload = {
      analysis,
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    this.logger.log(`Invoices | total: ${total}, page: ${page}/${totalPages}`);
    return ResponseHelper.success('Invoices retrieved', payload);
  }

  private computeAnalysis(invoices: Array<{
    status: InvoiceStatus;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    taxAmount: number | null;
  }>) {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let totalTax = 0;
    const byStatus: Record<string, number> = {};

    for (const inv of invoices) {
      totalAmount += inv.totalAmount;
      totalPaid += inv.amountPaid;
      totalBalance += inv.balanceDue;
      totalTax += inv.taxAmount ?? 0;
      byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
    }

    return {
      totalInvoices: invoices.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      byStatus,
    };
  }

  async create(dto: CreateInvoiceDto, createdById?: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: dto.invoiceNumber },
    });
    if (existing) {
      throw new BadRequestException(`Invoice ${dto.invoiceNumber} already exists`);
    }

    if (dto.bulkOrderId) {
      const bulkOrder = await this.prisma.bulkOrder.findUnique({
        where: { id: dto.bulkOrderId },
      });
      if (!bulkOrder) {
        throw new BadRequestException('Bulk order not found');
      }
    }

    const subtotal = dto.items.reduce(
      (sum, i) => sum + (i.totalAmount ?? i.quantity * i.unitPrice),
      0,
    );
    const taxAmount = dto.taxAmount ?? 0;
    const totalAmount = subtotal + taxAmount;
    const amountPaid = dto.amountPaid ?? 0;
    const balanceDue = totalAmount - amountPaid;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        bulkOrderId: dto.bulkOrderId ?? null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerCompany: dto.customerCompany ?? null,
        issueDate: new Date(dto.issueDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: (dto.status as InvoiceStatus) ?? InvoiceStatus.draft,
        subtotal,
        taxAmount,
        totalAmount,
        amountPaid,
        balanceDue,
        paymentTerms: dto.paymentTerms ?? null,
        notes: dto.notes ?? null,
        createdById: createdById ?? null,
        items: {
          create: dto.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit ?? 'pieces',
            unitPrice: i.unitPrice,
            totalAmount: i.totalAmount ?? i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    this.logger.log(`Invoice created | ${invoice.invoiceNumber}`);
    return ResponseHelper.created('Invoice created successfully', invoice);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        bulkOrder: {
          select: {
            id: true,
            referenceNumber: true,
            buyerName: true,
            buyerCompany: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return ResponseHelper.success('Invoice retrieved', invoice);
  }
}
