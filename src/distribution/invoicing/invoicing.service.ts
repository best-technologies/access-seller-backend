import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoiceStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/services/storage.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { amountToWords } from 'src/shared/utils/amount-in-words';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

const DEFAULT_COMPANY_ADDRESS = '121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan';
const DEFAULT_COMPANY_PHONE = '08038086862, 08174615808';
const STORAGE_RECEIPT_FOLDER = 'distribution/invoices';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    let seq = 1;
    if (last) {
      const match = last.invoiceNumber.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) seq = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

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
        include: { items: { include: { product: true } } },
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
    const invoiceNumber =
      dto.invoiceNumber?.trim() || (await this.generateInvoiceNumber());
    if (dto.invoiceNumber?.trim()) {
      const existing = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (existing) {
        throw new BadRequestException(`Invoice ${invoiceNumber} already exists`);
      }
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
    // New invoices start as payment pending – no payment received, no stock reduction
    const amountPaid = 0;
    const balanceDue = totalAmount;

    // Validate productIds if provided
    for (const item of dto.items) {
      if (item.productId) {
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          this.logger.error(`Product not found: ${item.productId}`);
          throw new BadRequestException(`Product not found: ${item.productId}`);
        }
      }
    }

    const amountInWords = amountToWords(totalAmount);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        bulkOrderId: dto.bulkOrderId ?? null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerCompany: dto.customerCompany ?? null,
        companyAddress: dto.companyAddress ?? DEFAULT_COMPANY_ADDRESS,
        companyPhone: dto.companyPhone ?? DEFAULT_COMPANY_PHONE,
        issueDate: new Date(dto.issueDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: (dto.status as InvoiceStatus) ?? InvoiceStatus.issued,
        subtotal,
        taxAmount,
        totalAmount,
        amountPaid,
        balanceDue,
        amountInWords,
        paymentTerms: dto.paymentTerms ?? null,
        notes: dto.notes ?? null,
        managerSignedBy: dto.managerSignedBy ?? null,
        customerSignedBy: dto.customerSignedBy ?? null,
        createdById: createdById ?? null,
        items: {
          create: dto.items.map((i) => ({
            description: i.description,
            productId: i.productId ?? null,
            quantity: i.quantity,
            unit: i.unit ?? 'pieces',
            unitPrice: i.unitPrice,
            totalAmount: i.totalAmount ?? i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    this.logger.log(`Invoice created | ${invoice.invoiceNumber}`);
    return ResponseHelper.created('Invoice created successfully', invoice);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
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

  async getPayments(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    const payments = await this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
    return ResponseHelper.success('Payment history retrieved', payments);
  }

  async recordPayment(
    invoiceId: string,
    dto: RecordPaymentDto,
    receiptFile?: Express.Multer.File,
    recordedById?: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { include: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === InvoiceStatus.paid) {
      throw new BadRequestException('Invoice is already fully paid');
    }
    if (invoice.status === InvoiceStatus.cancelled) {
      throw new BadRequestException('Cannot record payment for cancelled invoice');
    }

    const paymentAmount = Math.round(dto.amount * 100) / 100;
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }
    if (paymentAmount > invoice.balanceDue) {
      throw new BadRequestException(
        `Payment amount (₦${paymentAmount.toLocaleString()}) exceeds balance due (₦${invoice.balanceDue.toLocaleString()})`,
      );
    }

    let receiptUrl: string | null = null;
    let receiptPublicId: string | null = null;
    if (receiptFile) {
      const [upload] = await this.storage.upload(
        [receiptFile],
        STORAGE_RECEIPT_FOLDER,
      );
      receiptUrl = upload.secure_url;
      receiptPublicId = upload.public_id;
    }

    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newBalanceDue = invoice.totalAmount - newAmountPaid;
    const becomesFullyPaid = newBalanceDue <= 0;

    if (becomesFullyPaid) {
      const itemsWithProduct = invoice.items.filter((i) => i.productId != null);
      for (const item of itemsWithProduct) {
        if (!item.productId || !item.product) continue;
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;
        const newStock = product.currentStock - item.quantity;
        if (newStock < 0) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.sku} (${product.name}). Current: ${product.currentStock}, required: ${item.quantity}`,
          );
        }
      }
      for (const item of itemsWithProduct) {
        if (!item.productId) continue;
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore - item.quantity;
        await this.prisma.distributionProduct.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await this.prisma.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: StockMovementType.invoice_out,
            quantityDelta: -item.quantity,
            stockBefore,
            stockAfter,
            invoiceId,
          },
        });
      }
    }

    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.invoicePayment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          paymentMethod: dto.paymentMethod ?? null,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
          receiptUrl,
          receiptPublicId,
          recordedById: recordedById ?? null,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: Math.round(newAmountPaid * 100) / 100,
          balanceDue: Math.round(Math.max(0, newBalanceDue) * 100) / 100,
          status: becomesFullyPaid ? InvoiceStatus.paid : InvoiceStatus.partial,
        },
        include: { items: { include: { product: true } }, payments: true },
      }),
    ]);

    this.logger.log(
      `Payment recorded | invoice: ${invoice.invoiceNumber}, amount: ₦${paymentAmount}, status: ${updated.status}${becomesFullyPaid ? ', stock reduced' : ''}`,
    );
    return ResponseHelper.created(
      becomesFullyPaid ? 'Payment recorded and invoice fully paid. Stock reduced.' : 'Payment recorded',
      { payment, invoice: updated },
    );
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.companyAddress !== undefined && { companyAddress: dto.companyAddress }),
        ...(dto.companyPhone !== undefined && { companyPhone: dto.companyPhone }),
        ...(dto.managerSignedBy !== undefined && { managerSignedBy: dto.managerSignedBy }),
        ...(dto.managerSignedAt !== undefined && {
          managerSignedAt: new Date(dto.managerSignedAt),
        }),
        ...(dto.customerSignedBy !== undefined && {
          customerSignedBy: dto.customerSignedBy,
        }),
        ...(dto.customerSignedAt !== undefined && {
          customerSignedAt: new Date(dto.customerSignedAt),
        }),
      },
      include: { items: { include: { product: true } } },
    });
    this.logger.log(`Invoice updated | ${updated.invoiceNumber}`);
    return ResponseHelper.success('Invoice updated', updated);
  }

  async markAsPaid(id: string, dto: MarkInvoicePaidDto) {
    this.logger.log(`markAsPaid | entered | id: ${id}`);
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === InvoiceStatus.paid) {
      throw new BadRequestException('Invoice is already fully paid');
    }
    if (invoice.status === InvoiceStatus.cancelled) {
      throw new BadRequestException('Cannot mark cancelled invoice as paid');
    }

    const paymentAmount = dto.amountPaid ?? invoice.totalAmount - invoice.amountPaid;
    const newAmountPaid = Math.min(invoice.amountPaid + paymentAmount, invoice.totalAmount);
    const newBalanceDue = invoice.totalAmount - newAmountPaid;
    const becomesFullyPaid = newBalanceDue <= 0;

    if (becomesFullyPaid) {
      // Reduce stock for items with productId and record stock movement
      const itemsWithProduct = invoice.items.filter((i) => i.productId != null);
      for (const item of itemsWithProduct) {
        if (!item.productId || !item.product) continue;
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;
        const newStock = product.currentStock - item.quantity;
        if (newStock < 0) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.sku} (${product.name}). Current: ${product.currentStock}, required: ${item.quantity}`,
          );
        }
      }
      for (const item of itemsWithProduct) {
        if (!item.productId) continue;
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore - item.quantity;
        await this.prisma.distributionProduct.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await this.prisma.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: StockMovementType.invoice_out,
            quantityDelta: -item.quantity,
            stockBefore,
            stockAfter,
            invoiceId: id,
          },
        });
      }
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: Math.round(newAmountPaid * 100) / 100,
        balanceDue: Math.round(Math.max(0, newBalanceDue) * 100) / 100,
        status: becomesFullyPaid ? InvoiceStatus.paid : InvoiceStatus.partial,
      },
      include: { items: { include: { product: true } } },
    });

    this.logger.log(
      `markAsPaid | success | id: ${id}, status: ${updated.status}${becomesFullyPaid ? ', stock reduced' : ''}`,
    );
    return ResponseHelper.success(
      becomesFullyPaid ? 'Invoice marked as paid and stock reduced' : 'Payment recorded',
      updated,
    );
  }

  async unmarkAsPaid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status !== InvoiceStatus.paid) {
      throw new BadRequestException('Invoice is not fully paid; nothing to unmark');
    }

    const sumFromPayments = invoice.payments.reduce((s, p) => s + p.amount, 0);
    if (sumFromPayments >= invoice.totalAmount) {
      throw new BadRequestException(
        'Invoice was fully paid via payment records. Cannot unmark. Remove payment records if you need to revert.',
      );
    }

    const newAmountPaid = Math.round(sumFromPayments * 100) / 100;
    const newBalanceDue = Math.round((invoice.totalAmount - newAmountPaid) * 100) / 100;
    const newStatus = newAmountPaid > 0 ? InvoiceStatus.partial : InvoiceStatus.issued;

    // Restore stock and record movement (invoice_restore)
    const itemsWithProduct = invoice.items.filter((i) => i.productId != null);
    for (const item of itemsWithProduct) {
      if (!item.productId) continue;
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;
      const stockBefore = product.currentStock;
      const stockAfter = stockBefore + item.quantity;
      await this.prisma.distributionProduct.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      });
      await this.prisma.stockMovement.create({
        data: {
          productId: item.productId,
          movementType: StockMovementType.invoice_restore,
          quantityDelta: item.quantity,
          stockBefore,
          stockAfter,
          invoiceId: id,
        },
      });
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
      include: { items: { include: { product: true } }, payments: true },
    });

    this.logger.log(
      `unmarkAsPaid | success | id: ${id}, status: ${updated.status}, stock restored`,
    );
    return ResponseHelper.success(
      'Invoice unmarked as paid. Stock restored.',
      updated,
    );
  }
}
