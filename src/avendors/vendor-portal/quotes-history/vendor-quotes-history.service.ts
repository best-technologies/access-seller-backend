import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AvendorPaymentApprovalStatus,
  AvendorVendorOrderStage,
  AvendorVendorQuoteLineDecision,
  AvendorVendorQuoteStatus,
  Prisma,
} from '@prisma/client';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  ListVendorQuoteHistoryQueryDto,
  VendorQuoteHistoryView,
} from './dto/list-quotes-history-query.dto';
import {
  UpdateVendorFulfillmentStageDto,
  VendorFulfillmentStage,
} from './dto/update-fulfillment-stage.dto';

/**
 * Quote statuses that appear on the Quotes History screen. `draft` quotes are
 * deliberately excluded — they have not been submitted yet and should only be
 * visible from the Quote Requests flow.
 */
const HISTORY_STATUSES: AvendorVendorQuoteStatus[] = [
  AvendorVendorQuoteStatus.submitted,
  AvendorVendorQuoteStatus.accepted,
  AvendorVendorQuoteStatus.rejected,
  AvendorVendorQuoteStatus.withdrawn,
];

/**
 * Legal forward transitions for the vendor-driven fulfillment timeline. The
 * vendor may only move the order strictly forward; admin owns cancellations.
 */
const STAGE_ORDER: AvendorVendorOrderStage[] = [
  AvendorVendorOrderStage.created,
  AvendorVendorOrderStage.in_production,
  AvendorVendorOrderStage.in_transit,
  AvendorVendorOrderStage.delivered,
];

/** Friendly label used in the timeline response and `totals` summary. */
function stageLabel(stage: AvendorVendorOrderStage): string {
  switch (stage) {
    case AvendorVendorOrderStage.created:
      return 'Order Created';
    case AvendorVendorOrderStage.in_production:
      return 'In Production';
    case AvendorVendorOrderStage.in_transit:
      return 'In Transit';
    case AvendorVendorOrderStage.delivered:
      return 'Delivered';
    case AvendorVendorOrderStage.cancelled:
      return 'Cancelled';
    default:
      return stage;
  }
}

@Injectable()
export class VendorQuotesHistoryService {
  private readonly logger = new Logger(VendorQuotesHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── LIST ─────────────────────────────────────────────────

  /**
   * Paginated list of all the vendor's submitted quotes, with per-tab counts
   * baked into the response so the frontend tab chips (`All (21)` etc.) don't
   * require a second roundtrip.
   */
  async listHistory(vendorId: string, query: ListVendorQuoteHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const view = query.view ?? VendorQuoteHistoryView.all;

    const statusFilter = this.statusFilterForView(view);

    const where: Prisma.AvendorVendorQuoteWhereInput = {
      vendorId,
      status: { in: statusFilter },
      ...(search && {
        OR: [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { rfq: { rfqNumber: { contains: search, mode: 'insensitive' } } },
          { rfq: { title: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [rows, total, tabCounts] = await Promise.all([
      this.prisma.avendorVendorQuote.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          rfq: {
            select: {
              id: true,
              rfqNumber: true,
              title: true,
              dueDate: true,
              status: true,
            },
          },
          lines: {
            select: { id: true, rfqItemId: true, decision: true },
          },
          order: {
            select: {
              id: true,
              stage: true,
              expectedDeliveryAt: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
      }),
      this.prisma.avendorVendorQuote.count({ where }),
      this.computeTabCounts(vendorId),
    ]);

    const items = rows.map((row) => this.shapeHistoryRow(row));

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] quotes-history list view=${view} ${items.length}/${total} search=${search ?? ''}`,
      ),
    );

    return ResponseHelper.success('Quotes history retrieved', items, {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + items.length < total,
      hasPrevPage: page > 1,
      tabs: tabCounts,
    });
  }

  // ─── DETAIL (Overview tab) ────────────────────────────────

  async getHistoryDetail(vendorId: string, quoteId: string) {
    const quote = await this.loadOwnedQuote(vendorId, quoteId, {
      rfq: {
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              attachments: {
                select: { id: true, imageUrl: true, originalFilename: true },
              },
            },
          },
        },
      },
      paymentPlan: true,
      lines: { orderBy: [{ rfqItemId: 'asc' }, { position: 'asc' }] },
      order: true,
    });

    // Lazily ensure an order row exists for any quote the admin has awarded
    // so the frontend's fulfillment tab has something to render.
    const order =
      quote.status === AvendorVendorQuoteStatus.accepted
        ? (quote.order ?? (await this.ensureOrderForAcceptedQuote(quote)))
        : quote.order;

    const acceptedLines = quote.lines.filter(
      (l) => l.decision === AvendorVendorQuoteLineDecision.accepted,
    );
    const acceptedItemIds = new Set(acceptedLines.map((l) => l.rfqItemId));

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] quotes-history detail quote=${quote.quoteNumber} status=${quote.status} stage=${order?.stage ?? 'n/a'}`,
      ),
    );

    return ResponseHelper.success('Quote detail retrieved', {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      displayStatus: this.displayStatus(quote.status),
      currency: quote.currency,
      totalAmount: quote.totalAmount,
      note: quote.note,
      submittedAt: quote.submittedAt,
      withdrawnAt: quote.withdrawnAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      rfq: {
        id: quote.rfq.id,
        rfqNumber: quote.rfq.rfqNumber,
        title: quote.rfq.title,
        status: quote.rfq.status,
        expectedDelivery: quote.rfq.dueDate,
      },
      summary: {
        totalItems: quote.rfq.items.length,
        totalPriceOptions: quote.lines.length,
        acceptedItems: acceptedItemIds.size,
        acceptedLines: acceptedLines.length,
        totalQuoted: Number(quote.totalAmount ?? 0),
        expectedDelivery: order?.expectedDeliveryAt ?? quote.rfq.dueDate,
        dateSubmitted: quote.submittedAt ?? quote.createdAt,
      },
      paymentPlan: quote.paymentPlan
        ? {
            id: quote.paymentPlan.id,
            name: quote.paymentPlan.name,
            code: quote.paymentPlan.code,
            description: quote.paymentPlan.description,
            netDays: quote.paymentPlan.netDays,
          }
        : null,
      paymentPlanSetBy: quote.paymentPlanSetBy,
      paymentPlanSetAt: quote.paymentPlanSetAt,
      items: this.shapeDetailItems(quote.rfq.items, quote.lines),
      order: order
        ? {
            id: order.id,
            stage: order.stage,
            stageLabel: stageLabel(order.stage),
            expectedDeliveryAt: order.expectedDeliveryAt,
          }
        : null,
    });
  }

  // ─── FULFILLMENT TIMELINE ─────────────────────────────────

  /**
   * Returns the ordered timeline of stage transitions + payment-approval
   * events for an awarded quote. Silently no-ops (404) for quotes that have
   * not been awarded — the UI only renders this tab for awarded quotes.
   */
  async getFulfillment(vendorId: string, quoteId: string) {
    const quote = await this.loadOwnedQuote(vendorId, quoteId, {
      order: true,
      paymentApprovals: {
        orderBy: [{ approvedAt: 'asc' }, { createdAt: 'asc' }],
      },
      rfq: { select: { dueDate: true, rfqNumber: true } },
    });

    if (quote.status !== AvendorVendorQuoteStatus.accepted) {
      throw new BadRequestException(
        'Order fulfillment is only available for awarded quotes',
      );
    }

    const order = quote.order ?? (await this.ensureOrderForAcceptedQuote(quote));

    const timeline = this.buildTimeline(order, quote.paymentApprovals);
    const totalApproved = quote.paymentApprovals
      .filter((p) => p.status === AvendorPaymentApprovalStatus.approved)
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);

    return ResponseHelper.success('Order fulfillment timeline retrieved', {
      order: {
        id: order.id,
        quoteId: order.quoteId,
        stage: order.stage,
        stageLabel: stageLabel(order.stage),
        expectedDeliveryAt: order.expectedDeliveryAt ?? quote.rfq.dueDate,
        productionStartedAt: order.productionStartedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        note: order.note,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      timeline,
      payments: quote.paymentApprovals.map((p) => ({
        id: p.id,
        label: p.label,
        percentage: p.percentage,
        amount: Number(p.amount ?? 0),
        currency: p.currency,
        status: p.status,
        approvedAt: p.approvedAt,
        reference: p.reference,
        proof: p.proofUrl
          ? {
              url: p.proofUrl,
              publicId: p.proofPublicId,
              originalFilename: p.proofOriginalFilename,
            }
          : null,
      })),
      totals: {
        totalQuoted: Number(quote.totalAmount ?? 0),
        totalApproved,
        outstanding: Math.max(
          0,
          Number(quote.totalAmount ?? 0) - totalApproved,
        ),
        currency: quote.currency,
      },
    });
  }

  // ─── UPDATE STAGE ─────────────────────────────────────────

  /**
   * Move the order forward (e.g. admin marks awarded → vendor marks
   * production started, then shipped, then delivered). Guards against
   * moving backwards or skipping cancelled orders.
   */
  async updateFulfillmentStage(
    vendorId: string,
    quoteId: string,
    dto: UpdateVendorFulfillmentStageDto,
  ) {
    const quote = await this.loadOwnedQuote(vendorId, quoteId, {
      order: true,
    });

    if (quote.status !== AvendorVendorQuoteStatus.accepted) {
      throw new BadRequestException(
        'Only awarded quotes can have their fulfillment updated',
      );
    }

    const order = quote.order ?? (await this.ensureOrderForAcceptedQuote(quote));

    if (order.stage === AvendorVendorOrderStage.cancelled) {
      throw new ConflictException('This order has been cancelled');
    }
    if (order.stage === AvendorVendorOrderStage.delivered) {
      throw new ConflictException(
        'This order is already marked as delivered',
      );
    }

    const nextStage = dto.stage as unknown as AvendorVendorOrderStage;
    this.assertForwardTransition(order.stage, nextStage);

    const now = new Date();
    const patch: Prisma.AvendorVendorOrderUpdateInput = {
      stage: nextStage,
      note: dto.note?.trim() || order.note,
    };
    if (nextStage === AvendorVendorOrderStage.in_production) {
      patch.productionStartedAt = order.productionStartedAt ?? now;
    }
    if (nextStage === AvendorVendorOrderStage.in_transit) {
      patch.productionStartedAt = order.productionStartedAt ?? now;
      patch.shippedAt = order.shippedAt ?? now;
    }
    if (nextStage === AvendorVendorOrderStage.delivered) {
      patch.productionStartedAt = order.productionStartedAt ?? now;
      patch.shippedAt = order.shippedAt ?? now;
      patch.deliveredAt = now;
    }

    const updated = await this.prisma.avendorVendorOrder.update({
      where: { id: order.id },
      data: patch,
    });

    this.logger.log(
      colors.green(
        `[vendor=${vendorId}] order ${updated.id} stage ${order.stage} → ${nextStage}`,
      ),
    );

    return ResponseHelper.success('Fulfillment stage updated', {
      order: {
        id: updated.id,
        quoteId: updated.quoteId,
        stage: updated.stage,
        stageLabel: stageLabel(updated.stage),
        expectedDeliveryAt: updated.expectedDeliveryAt,
        productionStartedAt: updated.productionStartedAt,
        shippedAt: updated.shippedAt,
        deliveredAt: updated.deliveredAt,
        cancelledAt: updated.cancelledAt,
        note: updated.note,
        updatedAt: updated.updatedAt,
      },
    });
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────

  private statusFilterForView(
    view: VendorQuoteHistoryView,
  ): AvendorVendorQuoteStatus[] {
    switch (view) {
      case VendorQuoteHistoryView.awarded:
        return [AvendorVendorQuoteStatus.accepted];
      case VendorQuoteHistoryView.pending:
        return [AvendorVendorQuoteStatus.submitted];
      case VendorQuoteHistoryView.all:
      default:
        return HISTORY_STATUSES;
    }
  }

  /** Counts driving the All / Awarded / Pending tab chips in the UI. */
  private async computeTabCounts(vendorId: string) {
    const grouped = await this.prisma.avendorVendorQuote.groupBy({
      by: ['status'],
      where: {
        vendorId,
        status: { in: HISTORY_STATUSES },
      },
      _count: { _all: true },
    });

    const byStatus = new Map<AvendorVendorQuoteStatus, number>();
    for (const row of grouped) {
      byStatus.set(row.status, row._count._all);
    }

    const awarded = byStatus.get(AvendorVendorQuoteStatus.accepted) ?? 0;
    const pending = byStatus.get(AvendorVendorQuoteStatus.submitted) ?? 0;
    const rejected = byStatus.get(AvendorVendorQuoteStatus.rejected) ?? 0;
    const withdrawn = byStatus.get(AvendorVendorQuoteStatus.withdrawn) ?? 0;

    return {
      all: awarded + pending + rejected + withdrawn,
      awarded,
      pending,
      rejected,
      withdrawn,
    };
  }

  /**
   * Central accessor: every history endpoint runs through this so the
   * `vendorId` ownership guard happens in exactly one place.
   */
  private async loadOwnedQuote<T extends Prisma.AvendorVendorQuoteInclude>(
    vendorId: string,
    quoteId: string,
    include: T,
  ) {
    const quote = await this.prisma.avendorVendorQuote.findFirst({
      where: { id: quoteId, vendorId },
      include,
    });
    if (!quote) {
      throw new NotFoundException(
        'Quote not found or not owned by your account',
      );
    }
    return quote as Prisma.AvendorVendorQuoteGetPayload<{ include: T }>;
  }

  /**
   * Create-on-read for accepted quotes that don't yet have an order row.
   * Idempotent — relies on the unique constraint on `quoteId` in
   * `AvendorVendorOrder`.
   */
  private async ensureOrderForAcceptedQuote(quote: {
    id: string;
    vendorId: string;
  }) {
    try {
      return await this.prisma.avendorVendorOrder.create({
        data: {
          quoteId: quote.id,
          vendorId: quote.vendorId,
          stage: AvendorVendorOrderStage.created,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.avendorVendorOrder.findUnique({
          where: { quoteId: quote.id },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  private buildTimeline(
    order: {
      stage: AvendorVendorOrderStage;
      createdAt: Date;
      productionStartedAt: Date | null;
      shippedAt: Date | null;
      deliveredAt: Date | null;
      cancelledAt: Date | null;
    },
    payments: Array<{
      id: string;
      label: string | null;
      percentage: number | null;
      amount: number;
      currency: string;
      status: AvendorPaymentApprovalStatus;
      approvedAt: Date | null;
      createdAt: Date;
      proofUrl: string | null;
    }>,
  ) {
    type Entry =
      | {
          type: 'stage';
          stage: AvendorVendorOrderStage;
          label: string;
          occurredAt: Date | null;
          state: 'done' | 'active' | 'pending';
        }
      | {
          type: 'payment';
          id: string;
          label: string;
          percentage: number | null;
          amount: number;
          currency: string;
          approvedAt: Date | null;
          state: 'done' | 'pending';
          hasProof: boolean;
        };

    const currentIdx = STAGE_ORDER.indexOf(order.stage);
    const stageTimestamps: Record<
      AvendorVendorOrderStage,
      Date | null
    > = {
      [AvendorVendorOrderStage.created]: order.createdAt,
      [AvendorVendorOrderStage.in_production]: order.productionStartedAt,
      [AvendorVendorOrderStage.in_transit]: order.shippedAt,
      [AvendorVendorOrderStage.delivered]: order.deliveredAt,
      [AvendorVendorOrderStage.cancelled]: order.cancelledAt,
    };

    const stageEntries: Entry[] = STAGE_ORDER.map((stage, idx) => {
      const state: Entry['state'] =
        idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'pending';
      return {
        type: 'stage',
        stage,
        label: stageLabel(stage),
        occurredAt: stageTimestamps[stage],
        state,
      };
    });

    const paymentEntries: Entry[] = payments.map((p) => ({
      type: 'payment',
      id: p.id,
      label:
        p.label ??
        (p.percentage ? `${p.percentage}% Payment` : 'Payment') +
          (p.status === AvendorPaymentApprovalStatus.approved
            ? ' Approved'
            : ' Pending'),
      percentage: p.percentage,
      amount: Number(p.amount ?? 0),
      currency: p.currency,
      approvedAt: p.approvedAt ?? p.createdAt,
      state:
        p.status === AvendorPaymentApprovalStatus.approved ? 'done' : 'pending',
      hasProof: !!p.proofUrl,
    }));

    const merged = [...stageEntries, ...paymentEntries];
    merged.sort((a, b) => {
      const aTs =
        a.type === 'stage' ? a.occurredAt?.getTime() : a.approvedAt?.getTime();
      const bTs =
        b.type === 'stage' ? b.occurredAt?.getTime() : b.approvedAt?.getTime();
      // Pending stage entries (no ts yet) always sort last.
      if (aTs == null && bTs == null) return 0;
      if (aTs == null) return 1;
      if (bTs == null) return -1;
      return aTs - bTs;
    });

    return merged;
  }

  private assertForwardTransition(
    current: AvendorVendorOrderStage,
    next: AvendorVendorOrderStage,
  ) {
    const currIdx = STAGE_ORDER.indexOf(current);
    const nextIdx = STAGE_ORDER.indexOf(next);
    if (currIdx < 0 || nextIdx < 0) {
      throw new BadRequestException(
        `Illegal stage transition ${current} → ${next}`,
      );
    }
    if (nextIdx <= currIdx) {
      throw new BadRequestException(
        `Cannot move order back to ${next} (current: ${current})`,
      );
    }
  }

  private displayStatus(status: AvendorVendorQuoteStatus):
    | 'Awarded'
    | 'Pending'
    | 'Rejected'
    | 'Withdrawn'
    | 'Draft' {
    switch (status) {
      case AvendorVendorQuoteStatus.accepted:
        return 'Awarded';
      case AvendorVendorQuoteStatus.submitted:
        return 'Pending';
      case AvendorVendorQuoteStatus.rejected:
        return 'Rejected';
      case AvendorVendorQuoteStatus.withdrawn:
        return 'Withdrawn';
      default:
        return 'Draft';
    }
  }

  private shapeHistoryRow(
    row: Prisma.AvendorVendorQuoteGetPayload<{
      include: {
        rfq: {
          select: {
            id: true;
            rfqNumber: true;
            title: true;
            dueDate: true;
            status: true;
          };
        };
        lines: { select: { id: true; rfqItemId: true; decision: true } };
        order: {
          select: {
            id: true;
            stage: true;
            expectedDeliveryAt: true;
            shippedAt: true;
            deliveredAt: true;
          };
        };
      };
    }>,
  ) {
    const totalItems = new Set(row.lines.map((l) => l.rfqItemId)).size;
    const acceptedItemIds = new Set(
      row.lines
        .filter((l) => l.decision === AvendorVendorQuoteLineDecision.accepted)
        .map((l) => l.rfqItemId),
    );

    return {
      id: row.id,
      quoteNumber: row.quoteNumber,
      reference: row.rfq.rfqNumber,
      title: row.rfq.title,
      status: row.status,
      displayStatus: this.displayStatus(row.status),
      totalItems,
      acceptedItems: acceptedItemIds.size,
      totalPriceOptions: row.lines.length,
      amountQuoted: Number(row.totalAmount ?? 0),
      currency: row.currency,
      dateSubmitted: row.submittedAt ?? row.createdAt,
      expectedDelivery: row.order?.expectedDeliveryAt ?? row.rfq.dueDate,
      rfqId: row.rfq.id,
      rfqStatus: row.rfq.status,
      fulfillment: row.order
        ? {
            stage: row.order.stage,
            stageLabel: stageLabel(row.order.stage),
            shippedAt: row.order.shippedAt,
            deliveredAt: row.order.deliveredAt,
          }
        : null,
    };
  }

  private shapeDetailItems(
    items: Array<{
      id: string;
      materialId: string | null;
      materialName: string;
      quantity: number;
      unit: string;
      description: string | null;
      attachments: Array<{
        id: string;
        imageUrl: string | null;
        originalFilename: string | null;
      }>;
    }>,
    lines: Array<{
      id: string;
      rfqItemId: string;
      position: number;
      quality: string | null;
      possibleDeliveryAt: Date | null;
      pricePerUnit: number;
      totalPrice: number;
      note: string | null;
      decision: AvendorVendorQuoteLineDecision;
      decisionNote: string | null;
      decisionAt: Date | null;
    }>,
  ) {
    const linesByItem = new Map<string, typeof lines>();
    for (const line of lines) {
      const bucket = linesByItem.get(line.rfqItemId) ?? [];
      bucket.push(line);
      linesByItem.set(line.rfqItemId, bucket);
    }
    for (const bucket of linesByItem.values()) {
      bucket.sort((a, b) => a.position - b.position);
    }

    return items.map((item) => {
      const priceOptions = (linesByItem.get(item.id) ?? []).map((line) => ({
        id: line.id,
        position: line.position,
        quality: line.quality,
        possibleDeliveryAt: line.possibleDeliveryAt,
        pricePerUnit: Number(line.pricePerUnit ?? 0),
        totalPrice: Number(line.totalPrice ?? 0),
        note: line.note,
        decision: line.decision,
        decisionLabel: this.lineDecisionLabel(line.decision),
        decisionNote: line.decisionNote,
        decisionAt: line.decisionAt,
      }));
      return {
        id: item.id,
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: Number(item.quantity ?? 0),
        unit: item.unit,
        description: item.description,
        imageUrl: item.attachments[0]?.imageUrl ?? null,
        attachments: item.attachments,
        priceOptions,
      };
    });
  }

  private lineDecisionLabel(
    d: AvendorVendorQuoteLineDecision,
  ): 'Accepted quote' | 'Rejected quote' | 'Pending decision' {
    switch (d) {
      case AvendorVendorQuoteLineDecision.accepted:
        return 'Accepted quote';
      case AvendorVendorQuoteLineDecision.rejected:
        return 'Rejected quote';
      default:
        return 'Pending decision';
    }
  }
}
