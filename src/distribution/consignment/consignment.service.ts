import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateConsignmentDto, ConsignmentItemDto } from './dto/create-consignment.dto';
import { AddConsignmentItemDto } from './dto/add-consignment-item.dto';
import { UpdateConsignmentItemDto } from './dto/update-consignment-item.dto';
import { ListConsignmentsQueryDto } from './dto/list-consignments-query.dto';
import { ConsignmentStatus } from '@prisma/client';

@Injectable()
export class ConsignmentService {
  private readonly logger = new Logger(ConsignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapItemToCreate(item: AddConsignmentItemDto | ConsignmentItemDto) {
    const quantity = item.quantity;
    const unitPrice = item.unitPrice;
    const totalCost = 'totalCost' in item && item.totalCost != null ? item.totalCost : quantity * unitPrice;
    return {
      productId: item.productId ?? null,
      productName: item.productName ?? '',
      sku: item.sku ?? null,
      description: item.description ?? null,
      brand: item.brand ?? null,
      model: item.model ?? null,
      cartons: item.cartons ?? 0,
      quantity,
      unit: item.unit ?? 'pieces',
      unitPrice,
      totalCost,
      condition: item.condition ?? 'new',
      metadata: item.metadata ? (item.metadata as Prisma.InputJsonValue) : undefined,
    };
  }

  private async recalcConsignmentTotals(consignmentId: string) {
    const items = await this.prisma.consignmentItem.findMany({
      where: { consignmentId },
    });
    const overallTotalCartons = items.reduce((s, i) => s + i.cartons, 0);
    const overallTotalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    const overallTotalCost = items.reduce((s, i) => s + i.totalCost, 0);
    await this.prisma.consignment.update({
      where: { id: consignmentId },
      data: {
        overallTotalCartons,
        overallTotalQuantity,
        overallTotalCost,
      },
    });
  }

  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CONS-${year}-`;
    const latest = await this.prisma.consignment.findMany({
      where: { referenceNumber: { startsWith: prefix } },
      select: { referenceNumber: true },
      orderBy: { referenceNumber: 'desc' },
      take: 1,
    });
    const nextSeq = latest.length === 0 ? 1 : (parseInt(latest[0].referenceNumber.slice(prefix.length), 10) || 0) + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  async create(dto: CreateConsignmentDto, receivedById?: string) {
    this.logger.log('Creating new consignment...');

    const referenceNumber = dto.referenceNumber?.trim()
      ? dto.referenceNumber.trim()
      : await this.generateReferenceNumber();

    const existing = await this.prisma.consignment.findUnique({
      where: { referenceNumber },
    });

    if (existing) {
      throw new BadRequestException(`Consignment with reference ${referenceNumber} already exists`);
    }

    const items = dto.items ?? [];
    const resolvedItems: Array<ConsignmentItemDto & { _productName?: string; _sku?: string }> = [];

    for (const item of items) {
      if (item.productId) {
        const product = await this.prisma.distributionProduct.findUnique({
          where: { id: item.productId, isActive: true },
        });
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found or inactive`);
        }
        resolvedItems.push({ ...item, _productName: product.name, _sku: product.sku });
        await this.prisma.distributionProduct.update({
          where: { id: product.id },
          data: { currentStock: { increment: item.quantity } },
        });
      } else if (!item.productName?.trim()) {
        throw new BadRequestException('Each item must have productId or productName');
      } else {
        resolvedItems.push({ ...item, _productName: item.productName, _sku: item.sku });
      }
    }

    const overallTotalCartons =
      dto.overallTotalCartons ?? items.reduce((sum, i) => sum + (i.cartons ?? 0), 0);
    const overallTotalQuantity =
      dto.overallTotalQuantity ?? items.reduce((sum, i) => sum + i.quantity, 0);
    const overallTotalCost =
      dto.overallTotalCost ??
      items.reduce((sum, i) => sum + (i.totalCost ?? i.quantity * i.unitPrice), 0);

    const itemsToCreate = resolvedItems.map((item) =>
      this.mapItemToCreate({
        ...item,
        productName: item._productName ?? item.productName ?? '',
        sku: item._sku ?? item.sku,
      }),
    );

    const consignment = await this.prisma.consignment.create({
      data: {
        referenceNumber,
        supplierName: dto.supplierName,
        supplierReference: dto.supplierReference,
        salesPersonName: dto.salesPersonName,
        salesPersonPhone: dto.salesPersonPhone,
        salesPersonEmail: dto.salesPersonEmail,
        invoiceNumber: dto.invoiceNumber,
        deliveryNote: dto.deliveryNote,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        deliveryTime: dto.deliveryTime,
        paymentModeTerms: dto.paymentModeTerms,
        manufacturerOrderNumber: dto.manufacturerOrderNumber,
        dispatchDocumentNumber: dto.dispatchDocumentNumber,
        overallTotalCartons,
        overallTotalQuantity,
        overallTotalCost,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        bankAccountName: dto.bankAccountName,
        totalPaid: dto.totalPaid,
        balanceToPay: dto.balanceToPay,
        amountToPayInWords: dto.amountToPayInWords,
        amountPaidInWords: dto.amountPaidInWords,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : null,
        status: dto.receivedAt ? ConsignmentStatus.received : ConsignmentStatus.pending,
        warehouseLocation: dto.warehouseLocation,
        notes: dto.notes,
        receivedById: receivedById ?? null,
        items:
          itemsToCreate.length > 0
            ? { create: itemsToCreate }
            : undefined,
      },
      include: {
        items: true,
      },
    });

    this.logger.log(`Consignment created: ${consignment.referenceNumber}`);
    return ResponseHelper.created('Consignment created successfully', consignment);
  }

  async addItem(consignmentId: string, dto: AddConsignmentItemDto) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: { items: true },
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    let productName = dto.productName ?? null;
    let sku = dto.sku ?? null;
    let productId: string | null = null;

    if (dto.productId) {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id: dto.productId, isActive: true },
      });
      if (!product) {
        throw new BadRequestException('Product not found or inactive');
      }
      productName = product.name;
      sku = product.sku;
      productId = product.id;
      await this.prisma.distributionProduct.update({
        where: { id: product.id },
        data: { currentStock: { increment: dto.quantity } },
      });
    } else if (!dto.productName?.trim()) {
      throw new BadRequestException('productName or productId is required');
    } else {
      productName = dto.productName.trim();
    }

    const totalCost = dto.quantity * dto.unitPrice;
    const item = await this.prisma.consignmentItem.create({
      data: {
        consignmentId,
        productId,
        productName,
        sku,
        description: dto.description ?? null,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        cartons: dto.cartons ?? 0,
        quantity: dto.quantity,
        unit: dto.unit ?? 'pieces',
        unitPrice: dto.unitPrice,
        totalCost,
        condition: dto.condition ?? 'new',
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    await this.recalcConsignmentTotals(consignmentId);

    const updated = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: { items: true },
    });
    return ResponseHelper.created('Item added to consignment', {
      item,
      consignment: updated,
    });
  }

  async updateItem(consignmentId: string, itemId: string, dto: UpdateConsignmentItemDto) {
    const item = await this.prisma.consignmentItem.findFirst({
      where: { id: itemId, consignmentId },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const quantity = dto.quantity ?? item.quantity;
    const unitPrice = dto.unitPrice ?? item.unitPrice;
    const totalCost = quantity * unitPrice;

    const updated = await this.prisma.consignmentItem.update({
      where: { id: itemId },
      data: {
        ...(dto.productName != null && { productName: dto.productName }),
        ...(dto.sku !== undefined && { sku: dto.sku ?? null }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.brand !== undefined && { brand: dto.brand ?? null }),
        ...(dto.model !== undefined && { model: dto.model ?? null }),
        ...(dto.cartons != null && { cartons: dto.cartons }),
        ...(dto.quantity != null && { quantity: dto.quantity }),
        ...(dto.unit !== undefined && { unit: dto.unit ?? 'pieces' }),
        ...(dto.unitPrice != null && { unitPrice: dto.unitPrice }),
        totalCost,
        ...(dto.condition !== undefined && { condition: dto.condition ?? 'new' }),
        ...(dto.metadata !== undefined && {
          metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
      },
    });

    await this.recalcConsignmentTotals(consignmentId);

    const consignment = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: { items: true },
    });
    return ResponseHelper.success('Item updated', {
      item: updated,
      consignment,
    });
  }

  async deleteItem(consignmentId: string, itemId: string) {
    const item = await this.prisma.consignmentItem.findFirst({
      where: { id: itemId, consignmentId },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.consignmentItem.delete({
      where: { id: itemId },
    });

    await this.recalcConsignmentTotals(consignmentId);

    const consignment = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: { items: true },
    });
    return ResponseHelper.success('Item deleted', { consignment });
  }

  private buildWhereFromQuery(query: ListConsignmentsQueryDto): Prisma.ConsignmentWhereInput {
    const where: Prisma.ConsignmentWhereInput = {};

    if (query.status) where.status = query.status;

    if (query.referenceNumber) {
      where.referenceNumber = { contains: query.referenceNumber, mode: 'insensitive' };
    }
    if (query.invoiceNumber) {
      where.invoiceNumber = { contains: query.invoiceNumber, mode: 'insensitive' };
    }
    if (query.supplierName) {
      where.supplierName = { contains: query.supplierName, mode: 'insensitive' };
    }

    if (query.fromDate || query.toDate) {
      where.deliveryDate = {};
      if (query.fromDate) where.deliveryDate.gte = new Date(query.fromDate);
      if (query.toDate) where.deliveryDate.lte = new Date(query.toDate);
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
        { referenceNumber: searchMode },
        { invoiceNumber: searchMode },
        { supplierName: searchMode },
        { deliveryNote: searchMode },
        { manufacturerOrderNumber: searchMode },
        { dispatchDocumentNumber: searchMode },
        { salesPersonName: searchMode },
      ];
    }

    return where;
  }

  async findAll(query: ListConsignmentsQueryDto) {
    const page = typeof query.page === 'number' ? query.page : Math.max(1, parseInt(String(query.page), 10) || 1);
    const limit = typeof query.limit === 'number' ? query.limit : Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 20));
    const skip = (page - 1) * limit;
    const where = this.buildWhereFromQuery(query);

    const validSortFields = ['createdAt', 'deliveryDate', 'referenceNumber', 'overallTotalCost', 'status'] as const;
    const sortField = validSortFields.includes(query.sortBy as (typeof validSortFields)[number]) ? (query.sortBy as (typeof validSortFields)[number]) : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);

    const orderBy = { [sortField]: sortOrder } as Prisma.ConsignmentOrderByWithRelationInput;

    const [consignments, total, allForAnalysis] = await Promise.all([
      this.prisma.consignment.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy,
      }),
      this.prisma.consignment.count({ where }),
      this.prisma.consignment.findMany({
        where,
        include: { items: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const analysis = this.computeAnalysis(allForAnalysis);

    const payload = {
      analysis,
      items: consignments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return ResponseHelper.success('Consignments retrieved', payload);
  }

  private computeAnalysis(consignments: Array<{
    status: ConsignmentStatus;
    supplierName: string;
    overallTotalCartons: number | null;
    overallTotalQuantity: number | null;
    overallTotalCost: number | null;
    totalPaid: number | null;
    balanceToPay: number | null;
    items: Array<{ cartons: number; quantity: number; totalCost: number }>;
  }>) {
    let totalCartons = 0;
    let totalQuantity = 0;
    let totalCost = 0;
    let totalPaid = 0;
    let totalBalanceToPay = 0;
    let totalLineItems = 0;

    const byStatus: Record<string, number> = {};
    const bySupplierMap = new Map<string, { count: number; totalCost: number; totalQuantity: number }>();

    for (const c of consignments) {
      const cartons = c.overallTotalCartons ?? c.items.reduce((s, i) => s + i.cartons, 0);
      const qty = c.overallTotalQuantity ?? c.items.reduce((s, i) => s + i.quantity, 0);
      const cost = c.overallTotalCost ?? c.items.reduce((s, i) => s + i.totalCost, 0);

      totalCartons += cartons;
      totalQuantity += qty;
      totalCost += cost;
      totalPaid += c.totalPaid ?? 0;
      totalBalanceToPay += c.balanceToPay ?? 0;
      totalLineItems += c.items.length;

      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

      const sup = bySupplierMap.get(c.supplierName) ?? { count: 0, totalCost: 0, totalQuantity: 0 };
      sup.count += 1;
      sup.totalCost += cost;
      sup.totalQuantity += qty;
      bySupplierMap.set(c.supplierName, sup);
    }

    const bySupplier = Array.from(bySupplierMap.entries())
      .map(([supplierName, data]) => ({ supplierName, ...data }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      totalConsignments: consignments.length,
      totalLineItems,
      totalCartons,
      totalQuantity,
      totalCost,
      totalPaid,
      totalBalanceToPay,
      byStatus,
      bySupplier,
    };
  }

  async findOne(id: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
      include: {
        items: true,
        documents: true,
        receivedBy: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
      },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    return ResponseHelper.success('Consignment retrieved', consignment);
  }
}
