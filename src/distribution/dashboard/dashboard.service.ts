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
      allProducts,
      allInvoices,
      recentInvoicesRaw,
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
      this.prisma.distributionProduct.findMany({
        select: {
          currentStock: true,
          costPrice: true,
          reorderLevel: true,
          category: true,
          isActive: true,
        },
      }),
      this.prisma.invoice.findMany({
        select: {
          status: true,
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          customerCompany: true,
          issueDate: true,
          dueDate: true,
          status: true,
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
    ]);

    // Full analysis from filtered sets
    const baseAnalysis = this.computeFullAnalysis(
      allConsignmentsForAnalysis,
      allBulkOrdersForAnalysis,
      consignmentDocuments,
      bulkOrderDocuments,
    );
    const stocksAnalysis = this.computeStockAnalysis(allProducts);
    const invoicesAnalysis = this.computeInvoiceAnalysis(allInvoices);
    const analysis = {
      ...baseAnalysis,
      stocks: stocksAnalysis,
      invoices: invoicesAnalysis,
    };

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
      recentInvoices: recentInvoicesRaw.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerName,
        company: inv.customerCompany ?? null,
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
        status: inv.status,
        total: inv.totalAmount,
        paid: inv.amountPaid,
        balanceDue: inv.balanceDue,
      })),
    };

    this.logger.log(
      `Dashboard | consignments: ${consignmentTotal}, bulkOrders: ${bulkOrderTotal}, products: ${allProducts.length}, invoices: ${recentInvoicesRaw.length}`,
    );

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

  private computeStockAnalysis(
    products: Array<{
      currentStock: number;
      costPrice: number | null;
      reorderLevel: number | null;
      category: string | null;
      isActive: boolean;
    }>,
  ) {
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const byCategory: Record<string, { count: number; quantity: number; value: number }> = {};

    for (const p of products) {
      if (!p.isActive) continue;
      totalQuantity += p.currentStock;
      totalValue += (p.costPrice ?? 0) * p.currentStock;
      if (p.currentStock === 0) outOfStockCount++;
      else if (p.reorderLevel != null && p.currentStock <= p.reorderLevel) lowStockCount++;

      const cat = p.category ?? '_uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, quantity: 0, value: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].quantity += p.currentStock;
      byCategory[cat].value += (p.costPrice ?? 0) * p.currentStock;
    }

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      totalQuantity,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category: category === '_uncategorized' ? null : category,
        count: data.count,
        quantity: data.quantity,
        value: Math.round(data.value * 100) / 100,
      })),
    };
  }

  private computeInvoiceAnalysis(
    invoices: Array<{
      status: string;
      totalAmount: number;
      amountPaid: number;
      balanceDue: number;
    }>,
  ) {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalanceDue = 0;
    const byStatus: Record<string, number> = {};

    for (const inv of invoices) {
      totalAmount += inv.totalAmount ?? 0;
      totalPaid += inv.amountPaid ?? 0;
      totalBalanceDue += inv.balanceDue ?? 0;
      byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
    }

    return {
      totalInvoices: invoices.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
      byStatus,
    };
  }
}
