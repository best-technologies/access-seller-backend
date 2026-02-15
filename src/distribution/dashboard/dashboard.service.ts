import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { ListDashboardQueryDto } from './dto/list-dashboard-query.dto';
import { BulkOrderStatus, ConsignmentStatus } from '@prisma/client';

@Injectable()
export class DistributionDashboardService {
  private readonly logger = new Logger(DistributionDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  private itemValue(item: { totalCost?: number; unitPrice?: number; unitCost?: number | null; quantity: number }) {
    return item.totalCost ?? (item.unitPrice ?? item.unitCost ?? 0) * item.quantity;
  }

  private buildConsignmentWhere(query: ListDashboardQueryDto): Prisma.ConsignmentWhereInput {
    const where: Prisma.ConsignmentWhereInput = {};
    if (query.consignmentStatus) where.status = query.consignmentStatus as ConsignmentStatus;
    if (query.consignmentReferenceNumber) {
      where.referenceNumber = { contains: query.consignmentReferenceNumber, mode: 'insensitive' };
    }
    if (query.consignmentInvoiceNumber) {
      where.invoiceNumber = { contains: query.consignmentInvoiceNumber, mode: 'insensitive' };
    }
    if (query.consignmentSupplierName) {
      where.supplierName = { contains: query.consignmentSupplierName, mode: 'insensitive' };
    }
    if (query.consignmentFromDate || query.consignmentToDate) {
      where.deliveryDate = {};
      if (query.consignmentFromDate) where.deliveryDate.gte = new Date(query.consignmentFromDate);
      if (query.consignmentToDate) where.deliveryDate.lte = new Date(query.consignmentToDate);
    }
    if (query.fromCreatedAt || query.toCreatedAt) {
      where.createdAt = {};
      if (query.fromCreatedAt) where.createdAt.gte = new Date(query.fromCreatedAt);
      if (query.toCreatedAt) where.createdAt.lte = new Date(query.toCreatedAt);
    }
    if (query.consignmentSearch?.trim()) {
      const term = query.consignmentSearch.trim();
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

  private buildBulkOrderWhere(query: ListDashboardQueryDto): Prisma.BulkOrderWhereInput {
    const where: Prisma.BulkOrderWhereInput = {};
    if (query.bulkOrderStatus) where.status = query.bulkOrderStatus as BulkOrderStatus;
    if (query.bulkOrderReferenceNumber) {
      where.referenceNumber = { contains: query.bulkOrderReferenceNumber, mode: 'insensitive' };
    }
    if (query.bulkOrderBuyerName) {
      where.buyerName = { contains: query.bulkOrderBuyerName, mode: 'insensitive' };
    }
    if (query.bulkOrderInvoiceNumber) {
      where.invoiceNumber = { contains: query.bulkOrderInvoiceNumber, mode: 'insensitive' };
    }
    if (query.fromCreatedAt || query.toCreatedAt) {
      where.createdAt = {};
      if (query.fromCreatedAt) where.createdAt.gte = new Date(query.fromCreatedAt);
      if (query.toCreatedAt) where.createdAt.lte = new Date(query.toCreatedAt);
    }
    if (query.bulkOrderSearch?.trim()) {
      const term = query.bulkOrderSearch.trim();
      const searchMode = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { referenceNumber: searchMode },
        { buyerName: searchMode },
        { buyerCompany: searchMode },
        { invoiceNumber: searchMode },
      ];
    }
    return where;
  }

  async getDashboard(query: ListDashboardQueryDto = {}) {

    const consignmentWhere = this.buildConsignmentWhere(query);
    const bulkOrderWhere = this.buildBulkOrderWhere(query);

    const consignmentPage = typeof query.consignmentPage === 'number' ? query.consignmentPage : Math.max(1, parseInt(String(query.consignmentPage), 10) || 1);
    const consignmentLimit = typeof query.consignmentLimit === 'number' ? query.consignmentLimit : Math.min(100, Math.max(1, parseInt(String(query.consignmentLimit), 10) || 20));
    const bulkOrderPage = typeof query.bulkOrderPage === 'number' ? query.bulkOrderPage : Math.max(1, parseInt(String(query.bulkOrderPage), 10) || 1);
    const bulkOrderLimit = typeof query.bulkOrderLimit === 'number' ? query.bulkOrderLimit : Math.min(100, Math.max(1, parseInt(String(query.bulkOrderLimit), 10) || 20));

    const consignmentSkip = (consignmentPage - 1) * consignmentLimit;
    const bulkOrderSkip = (bulkOrderPage - 1) * bulkOrderLimit;

    const validConsignmentSort = ['createdAt', 'deliveryDate', 'referenceNumber', 'overallTotalCost', 'status'] as const;
    const consignmentSortBy: (typeof validConsignmentSort)[number] = validConsignmentSort.includes(query.consignmentSortBy as any) ? (query.consignmentSortBy as (typeof validConsignmentSort)[number]) : 'createdAt';
    const consignmentSortOrder = query.consignmentSortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const consignmentOrderBy = { [consignmentSortBy as string]: consignmentSortOrder } as Prisma.ConsignmentOrderByWithRelationInput;

    const validBulkOrderSort = ['createdAt', 'referenceNumber', 'totalAmount', 'status'] as const;
    const bulkOrderSortBy: (typeof validBulkOrderSort)[number] = validBulkOrderSort.includes(query.bulkOrderSortBy as any) ? (query.bulkOrderSortBy as (typeof validBulkOrderSort)[number]) : 'createdAt';
    const bulkOrderSortOrder = query.bulkOrderSortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const bulkOrderOrderBy = { [bulkOrderSortBy as string]: bulkOrderSortOrder } as Prisma.BulkOrderOrderByWithRelationInput;

    const [
      paginatedConsignments,
      consignmentTotal,
      allConsignmentsForAnalysis,
      paginatedBulkOrders,
      bulkOrderTotal,
      allBulkOrdersForAnalysis,
      consignmentDocuments,
      bulkOrderDocuments,
    ] = await Promise.all([
      this.prisma.consignment.findMany({
        where: consignmentWhere,
        skip: consignmentSkip,
        take: consignmentLimit,
        include: {
          items: true,
          documents: true,
          receivedBy: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
        orderBy: consignmentOrderBy,
      }),
      this.prisma.consignment.count({ where: consignmentWhere }),
      this.prisma.consignment.findMany({
        where: consignmentWhere,
        include: { items: true },
      }),
      this.prisma.bulkOrder.findMany({
        where: bulkOrderWhere,
        skip: bulkOrderSkip,
        take: bulkOrderLimit,
        include: {
          items: { include: { consignmentItem: true } },
          documents: true,
        },
        orderBy: bulkOrderOrderBy,
      }),
      this.prisma.bulkOrder.count({ where: bulkOrderWhere }),
      this.prisma.bulkOrder.findMany({
        where: bulkOrderWhere,
        include: { items: true },
      }),
      this.prisma.consignmentDocument.findMany({
        where: { consignment: { is: consignmentWhere } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.bulkOrderDocument.findMany({
        where: { bulkOrder: { is: bulkOrderWhere } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Full analysis from filtered sets
    const analysis = this.computeFullAnalysis(allConsignmentsForAnalysis, allBulkOrdersForAnalysis, consignmentDocuments, bulkOrderDocuments);

    const consignmentTotalPages = Math.ceil(consignmentTotal / consignmentLimit);
    const bulkOrderTotalPages = Math.ceil(bulkOrderTotal / bulkOrderLimit);

    const dashboard = {
      analysis,
      consignments: {
        items: paginatedConsignments.map((c) => ({
          ...c,
          itemCount: c.items.length,
          totalQuantity: c.overallTotalQuantity ?? c.items.reduce((s, i) => s + i.quantity, 0),
          totalValue: c.overallTotalCost ?? c.items.reduce((s, i) => s + this.itemValue(i), 0),
          documentCount: c.documents.length,
        })),
        meta: {
          total: consignmentTotal,
          page: consignmentPage,
          limit: consignmentLimit,
          totalPages: consignmentTotalPages,
          hasNextPage: consignmentPage < consignmentTotalPages,
          hasPrevPage: consignmentPage > 1,
        },
      },
      bulkOrders: {
        items: paginatedBulkOrders.map((o) => {
          const total = o.totalAmount ?? o.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
          return {
            ...o,
            totalAmount: total,
            itemCount: o.items.length,
            documentCount: o.documents.length,
          };
        }),
        meta: {
          total: bulkOrderTotal,
          page: bulkOrderPage,
          limit: bulkOrderLimit,
          totalPages: bulkOrderTotalPages,
          hasNextPage: bulkOrderPage < bulkOrderTotalPages,
          hasPrevPage: bulkOrderPage > 1,
        },
      },
      recentConsignmentDocuments: consignmentDocuments.slice(0, 20),
      recentBulkOrderDocuments: bulkOrderDocuments.slice(0, 20),
    };

    this.logger.log(`Dashboard | consignments: ${consignmentTotal}, bulkOrders: ${bulkOrderTotal}`);

    return ResponseHelper.success('Distribution dashboard retrieved', dashboard);
  }

  private computeFullAnalysis(
    consignments: Array<{
      status: ConsignmentStatus;
      supplierName: string;
      overallTotalCartons: number | null;
      overallTotalQuantity: number | null;
      overallTotalCost: number | null;
      totalPaid: number | null;
      balanceToPay: number | null;
      items: Array<{ cartons: number; quantity: number; totalCost: number; unitPrice: number; unitCost: number | null }>;
    }>,
    bulkOrders: Array<{
      status: BulkOrderStatus;
      totalAmount: number | null;
      amountPaid: number | null;
      paymentStatus: string | null;
      items: Array<{ quantity: number; unitPrice: number | null }>;
    }>,
    consignmentDocuments: Array<{ documentType: string }>,
    bulkOrderDocuments: Array<{ documentType: string }>,
  ) {
    let totalConsignmentValue = 0;
    let totalItemsReceived = 0;
    let totalCartons = 0;
    const consignmentByStatus: Record<string, number> = {};
    const consignmentBySupplierMap = new Map<string, { count: number; totalCost: number; totalQuantity: number }>();

    for (const c of consignments) {
      const cartons = c.overallTotalCartons ?? c.items.reduce((s, i) => s + i.cartons, 0);
      const qty = c.overallTotalQuantity ?? c.items.reduce((s, i) => s + i.quantity, 0);
      const cost = c.overallTotalCost ?? c.items.reduce((s, i) => s + i.totalCost, 0);
      totalCartons += cartons;
      totalItemsReceived += qty;
      totalConsignmentValue += cost;

      consignmentByStatus[c.status] = (consignmentByStatus[c.status] ?? 0) + 1;

      const sup = consignmentBySupplierMap.get(c.supplierName) ?? { count: 0, totalCost: 0, totalQuantity: 0 };
      sup.count += 1;
      sup.totalCost += cost;
      sup.totalQuantity += qty;
      consignmentBySupplierMap.set(c.supplierName, sup);
    }

    const consignmentBySupplier = Array.from(consignmentBySupplierMap.entries())
      .map(([supplierName, data]) => ({ supplierName, ...data }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    let totalBulkRevenue = 0;
    let totalBulkPaid = 0;
    let totalBulkPending = 0;
    const bulkOrderByStatus: Record<string, number> = {};
    const bulkOrderByPaymentStatus = { pending: 0, partial: 0, paid: 0 };

    for (const o of bulkOrders) {
      const orderTotal = o.totalAmount ?? o.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
      totalBulkRevenue += orderTotal;
      totalBulkPaid += o.amountPaid ?? 0;
      totalBulkPending += orderTotal - (o.amountPaid ?? 0);

      bulkOrderByStatus[o.status] = (bulkOrderByStatus[o.status] ?? 0) + 1;
      if (o.paymentStatus) {
        const key = o.paymentStatus as 'pending' | 'partial' | 'paid';
        bulkOrderByPaymentStatus[key] = (bulkOrderByPaymentStatus[key] ?? 0) + 1;
      }
    }

    const consignmentDocByType = consignmentDocuments.reduce(
      (acc, d) => {
        acc[d.documentType] = (acc[d.documentType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const bulkOrderDocByType = bulkOrderDocuments.reduce(
      (acc, d) => {
        acc[d.documentType] = (acc[d.documentType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      consignments: {
        totalConsignments: consignments.length,
        totalLineItems: consignments.reduce((s, c) => s + c.items.length, 0),
        totalCartons,
        totalQuantity: totalItemsReceived,
        totalCost: Math.round(totalConsignmentValue * 100) / 100,
        totalPaid: Math.round(consignments.reduce((s, c) => s + (c.totalPaid ?? 0), 0) * 100) / 100,
        totalBalanceToPay: Math.round(consignments.reduce((s, c) => s + (c.balanceToPay ?? 0), 0) * 100) / 100,
        byStatus: consignmentByStatus,
        bySupplier: consignmentBySupplier,
      },
      bulkOrders: {
        totalBulkOrders: bulkOrders.length,
        totalRevenue: Math.round(totalBulkRevenue * 100) / 100,
        totalPaid: Math.round(totalBulkPaid * 100) / 100,
        totalPending: Math.round(totalBulkPending * 100) / 100,
        byStatus: bulkOrderByStatus,
        byPaymentStatus: bulkOrderByPaymentStatus,
      },
      documents: {
        consignmentDocs: consignmentDocuments.length,
        bulkOrderDocs: bulkOrderDocuments.length,
        consignmentByType: consignmentDocByType,
        bulkOrderByType: bulkOrderDocByType,
      },
    };
  }
}
