import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AvendorPaymentPlanSetBy,
  AvendorRfqStatus,
  AvendorVendorQuoteStatus,
  Prisma,
} from '@prisma/client';
import { SetVendorQuotePaymentPlanBodyDto } from 'src/avendors/shared/dto/set-vendor-quote-payment-plan.dto';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  ListVendorQuoteRequestsQueryDto,
  VendorQuoteRequestView,
} from './dto/list-quote-requests-query.dto';
import {
  SubmitQuoteLineDto,
  SubmitVendorQuoteDto,
} from './dto/submit-quote.dto';

/**
 * Statuses of an RFQ that a supplier can still react to. Once an RFQ is
 * awarded or cancelled the vendor cannot submit or edit a quote.
 */
const QUOTABLE_RFQ_STATUSES: AvendorRfqStatus[] = [
  AvendorRfqStatus.sent,
  AvendorRfqStatus.awaiting_selection,
];

@Injectable()
export class VendorQuoteRequestsService {
  private readonly logger = new Logger(VendorQuoteRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── LIST ─────────────────────────────────────────────────

  async listQuoteRequests(
    vendorId: string,
    query: ListVendorQuoteRequestsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const view = query.view ?? VendorQuoteRequestView.active;

    // Base: RFQ must be assigned to this vendor and still quotable.
    const where: Prisma.AvendorRfqVendorWhereInput = {
      vendorId,
      rfq: {
        status: { in: QUOTABLE_RFQ_STATUSES },
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { rfqNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(view === VendorQuoteRequestView.open && {
          vendorQuotes: {
            none: {
              vendorId,
              status: {
                in: [
                  AvendorVendorQuoteStatus.submitted,
                  AvendorVendorQuoteStatus.accepted,
                ],
              },
            },
          },
        }),
        ...(view === VendorQuoteRequestView.submitted && {
          vendorQuotes: {
            some: {
              vendorId,
              status: AvendorVendorQuoteStatus.submitted,
            },
          },
        }),
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.avendorRfqVendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rfq: {
            select: {
              id: true,
              rfqNumber: true,
              title: true,
              description: true,
              dueDate: true,
              submissionDeadline: true,
              status: true,
              totalBudget: true,
              sentAt: true,
              createdAt: true,
              _count: { select: { items: true } },
              vendorQuotes: {
                where: { vendorId },
                select: {
                  id: true,
                  quoteNumber: true,
                  status: true,
                  totalAmount: true,
                  currency: true,
                  submittedAt: true,
                  updatedAt: true,
                  paymentPlan: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.avendorRfqVendor.count({ where }),
    ]);

    const items = rows.map((row) => this.shapeListRow(row));

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] quote-requests listed view=${view} ${items.length}/${total}`,
      ),
    );

    return ResponseHelper.success('Quote requests retrieved', items, {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + items.length < total,
      hasPrevPage: page > 1,
    });
  }

  // ─── DETAIL ───────────────────────────────────────────────

  async getQuoteRequest(vendorId: string, rfqId: string) {
    const assignment = await this.prisma.avendorRfqVendor.findFirst({
      where: { vendorId, rfqId },
      include: {
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
            attachments: {
              select: { id: true, imageUrl: true, originalFilename: true },
            },
            vendorQuotes: {
              where: { vendorId },
              include: {
                lines: { orderBy: [{ rfqItemId: 'asc' }, { position: 'asc' }] },
                paymentPlan: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'Quote request not found or not assigned to your account',
      );
    }

    const rfq = assignment.rfq;
    const quote = rfq.vendorQuotes[0] ?? null;

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] quote-request detail rfq=${rfq.rfqNumber} items=${rfq.items.length} hasQuote=${!!quote}`,
      ),
    );

    return ResponseHelper.success('Quote request retrieved', {
      rfq: {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        totalBudget: rfq.totalBudget,
        expectedDelivery: rfq.dueDate,
        submissionDeadline: rfq.submissionDeadline ?? rfq.dueDate,
        sentAt: rfq.sentAt,
        createdAt: rfq.createdAt,
        attachments: rfq.attachments,
      },
      items: rfq.items.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        budget: item.budget,
        description: item.description,
        imageUrl: item.attachments[0]?.imageUrl ?? null,
        attachments: item.attachments,
      })),
      summary: {
        totalItems: rfq.items.length,
        totalAmount: rfq.items.reduce(
          (sum, i) => sum + Number(i.budget ?? 0) * Number(i.quantity ?? 0),
          0,
        ),
        currency: 'NGN',
      },
      quote: quote ? this.shapeQuote(quote, quote.lines) : null,
    });
  }

  // ─── SUBMIT / UPDATE ──────────────────────────────────────

  /**
   * Creates a new quote or replaces the existing one in-place.
   * Valid only while the RFQ is in `sent` / `awaiting_selection` and the
   * vendor's existing quote (if any) is not already `accepted` or `rejected`.
   */
  async submitQuote(
    vendorId: string,
    rfqId: string,
    dto: SubmitVendorQuoteDto,
  ) {
    const { rfq, existingQuote, itemMap } = await this.loadForMutation(
      vendorId,
      rfqId,
    );

    if (
      existingQuote &&
      (existingQuote.status === AvendorVendorQuoteStatus.accepted ||
        existingQuote.status === AvendorVendorQuoteStatus.rejected)
    ) {
      throw new ConflictException(
        `Quote is already ${existingQuote.status} and can no longer be edited`,
      );
    }

    this.assertRfqQuotable(rfq);

    const normalizedLines = this.normalizeLines(dto.lines, itemMap);
    const totalAmount = normalizedLines.reduce((s, l) => s + l.totalPrice, 0);

    const now = new Date();
    const currency = dto.currency?.trim() || existingQuote?.currency || 'NGN';

    const planPatch = await this.buildPaymentPlanPatchForSubmit(
      dto.paymentPlanId,
      !!existingQuote,
      now,
    );

    const quote = await this.prisma.$transaction(async (tx) => {
      if (existingQuote) {
        await tx.avendorVendorQuoteLine.deleteMany({
          where: { quoteId: existingQuote.id },
        });
        const data: Prisma.AvendorVendorQuoteUpdateInput = {
          status: AvendorVendorQuoteStatus.submitted,
          currency,
          totalAmount,
          note: dto.note?.trim() || null,
          submittedAt: now,
          withdrawnAt: null,
          lines: {
            create: normalizedLines.map((l) => ({
              rfqItemId: l.rfqItemId,
              position: l.position,
              quality: l.quality,
              possibleDeliveryAt: l.possibleDeliveryAt,
              pricePerUnit: l.pricePerUnit,
              totalPrice: l.totalPrice,
              note: l.note,
            })),
          },
        };
        if (planPatch !== 'omit') {
          if (planPatch.paymentPlanId) {
            data.paymentPlan = { connect: { id: planPatch.paymentPlanId } };
          } else {
            data.paymentPlan = { disconnect: true };
          }
          data.paymentPlanSetBy = planPatch.paymentPlanSetBy;
          data.paymentPlanSetAt = planPatch.paymentPlanSetAt;
        }
        const updated = await tx.avendorVendorQuote.update({
          where: { id: existingQuote.id },
          data,
          include: { lines: true, paymentPlan: true },
        });
        return updated;
      }

      const quoteNumber = await this.generateQuoteNumber(tx);
      const planFields =
        planPatch === 'omit'
          ? {
              paymentPlanId: null as string | null,
              paymentPlanSetBy: null,
              paymentPlanSetAt: null as Date | null,
            }
          : planPatch;

      const created = await tx.avendorVendorQuote.create({
        data: {
          rfqId,
          vendorId,
          quoteNumber,
          status: AvendorVendorQuoteStatus.submitted,
          currency,
          totalAmount,
          note: dto.note?.trim() || null,
          submittedAt: now,
          paymentPlanId: planFields.paymentPlanId,
          paymentPlanSetBy: planFields.paymentPlanSetBy,
          paymentPlanSetAt: planFields.paymentPlanSetAt,
          lines: {
            create: normalizedLines.map((l) => ({
              rfqItemId: l.rfqItemId,
              position: l.position,
              quality: l.quality,
              possibleDeliveryAt: l.possibleDeliveryAt,
              pricePerUnit: l.pricePerUnit,
              totalPrice: l.totalPrice,
              note: l.note,
            })),
          },
        },
        include: { lines: true, paymentPlan: true },
      });
      return created;
    });

    // Promote the RFQ from `sent` to `awaiting_selection` as soon as any vendor
    // submits a quote. Idempotent: no-op if already in awaiting_selection.
    if (rfq.status === AvendorRfqStatus.sent) {
      await this.prisma.avendorRfq.update({
        where: { id: rfqId },
        data: { status: AvendorRfqStatus.awaiting_selection },
      });
    }

    this.logger.log(
      colors.green(
        `[vendor=${vendorId}] quote ${existingQuote ? 'resubmitted' : 'submitted'} rfq=${rfq.rfqNumber} quote=${quote.quoteNumber} lines=${quote.lines.length} total=${totalAmount}`,
      ),
    );

    const payload = this.shapeQuote(quote, quote.lines);
    return existingQuote
      ? ResponseHelper.success('Quote updated', payload)
      : ResponseHelper.created('Quote submitted', payload);
  }

  // ─── PAYMENT PLANS (CATALOG) ────────────────────────────

  /** Active plans for dropdowns (`GET` before `/vendor/quote-requests/:id`). */
  async listActivePaymentPlans() {
    const rows = await this.prisma.avendorPaymentPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        netDays: true,
        sortOrder: true,
      },
    });
    return ResponseHelper.success('Payment plans retrieved', rows);
  }

  /**
   * Set or clear the payment plan on the vendor’s quote without resubmitting
   * all price lines. Same validation as quote submit (RFQ must still be open).
   */
  async setPaymentPlanOnQuote(
    vendorId: string,
    rfqId: string,
    dto: SetVendorQuotePaymentPlanBodyDto,
  ) {
    const { rfq, existingQuote } = await this.loadForMutation(vendorId, rfqId);
    if (!existingQuote) {
      throw new NotFoundException('Submit a quote before setting a payment plan');
    }
    if (
      existingQuote.status === AvendorVendorQuoteStatus.accepted ||
      existingQuote.status === AvendorVendorQuoteStatus.rejected
    ) {
      throw new ConflictException('Quote can no longer be edited');
    }
    this.assertRfqQuotable(rfq);

    const now = new Date();
    if (dto.paymentPlanId === null) {
      const updated = await this.prisma.avendorVendorQuote.update({
        where: { id: existingQuote.id },
        data: {
          paymentPlan: { disconnect: true },
          paymentPlanSetBy: null,
          paymentPlanSetAt: null,
        },
        include: { lines: true, paymentPlan: true },
      });
      return ResponseHelper.success(
        'Payment plan cleared',
        this.shapeQuote(updated, updated.lines),
      );
    }

    const plan = await this.prisma.avendorPaymentPlan.findFirst({
      where: { id: dto.paymentPlanId, isActive: true },
    });
    if (!plan) {
      throw new BadRequestException('Invalid or inactive payment plan id');
    }

    const updated = await this.prisma.avendorVendorQuote.update({
      where: { id: existingQuote.id },
      data: {
        paymentPlan: { connect: { id: plan.id } },
        paymentPlanSetBy: AvendorPaymentPlanSetBy.vendor,
        paymentPlanSetAt: now,
      },
      include: { lines: true, paymentPlan: true },
    });
    return ResponseHelper.success('Payment plan updated', this.shapeQuote(updated, updated.lines));
  }

  // ─── WITHDRAW ─────────────────────────────────────────────

  async withdrawQuote(vendorId: string, rfqId: string) {
    const { rfq, existingQuote } = await this.loadForMutation(vendorId, rfqId);

    if (!existingQuote) {
      throw new NotFoundException('No quote on file to withdraw');
    }

    if (existingQuote.status !== AvendorVendorQuoteStatus.submitted) {
      throw new BadRequestException(
        `Only a submitted quote can be withdrawn (current: ${existingQuote.status})`,
      );
    }

    this.assertRfqQuotable(rfq);

    const updated = await this.prisma.avendorVendorQuote.update({
      where: { id: existingQuote.id },
      data: {
        status: AvendorVendorQuoteStatus.withdrawn,
        withdrawnAt: new Date(),
      },
      include: { lines: true, paymentPlan: true },
    });

    this.logger.log(
      colors.yellow(
        `[vendor=${vendorId}] quote withdrawn rfq=${rfq.rfqNumber} quote=${updated.quoteNumber}`,
      ),
    );

    return ResponseHelper.success('Quote withdrawn', this.shapeQuote(updated, updated.lines));
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────

  private async loadForMutation(vendorId: string, rfqId: string) {
    const rfq = await this.prisma.avendorRfq.findUnique({
      where: { id: rfqId },
      include: {
        items: {
          select: { id: true, quantity: true, rfqId: true },
        },
        vendors: { where: { vendorId }, select: { id: true } },
        vendorQuotes: { where: { vendorId }, take: 1 },
      },
    });

    if (!rfq) {
      throw new NotFoundException('Quote request not found');
    }
    if (rfq.vendors.length === 0) {
      throw new ForbiddenException(
        'This quote request was not assigned to your account',
      );
    }

    const itemMap = new Map<string, { id: string; quantity: number }>();
    for (const item of rfq.items) {
      itemMap.set(item.id, { id: item.id, quantity: Number(item.quantity) });
    }

    return {
      rfq,
      existingQuote: rfq.vendorQuotes[0] ?? null,
      itemMap,
    };
  }

  private assertRfqQuotable(rfq: { status: AvendorRfqStatus; rfqNumber: string }) {
    if (!QUOTABLE_RFQ_STATUSES.includes(rfq.status)) {
      throw new BadRequestException(
        `RFQ ${rfq.rfqNumber} is ${rfq.status}; quotes can no longer be submitted or changed`,
      );
    }
  }

  /**
   * On first submit, every call site gets an explicit plan row (possibly all
   * null). On resubmit, `undefined` means “leave the current plan unchanged”.
   */
  private async buildPaymentPlanPatchForSubmit(
    input: string | null | undefined,
    isResubmit: boolean,
    at: Date,
  ): Promise<
    | 'omit'
    | {
        paymentPlanId: string | null;
        paymentPlanSetBy: AvendorPaymentPlanSetBy | null;
        paymentPlanSetAt: Date | null;
      }
  > {
    if (isResubmit && input === undefined) {
      return 'omit';
    }
    if (input === null) {
      return {
        paymentPlanId: null,
        paymentPlanSetBy: null,
        paymentPlanSetAt: null,
      };
    }
    if (input === undefined) {
      return {
        paymentPlanId: null,
        paymentPlanSetBy: null,
        paymentPlanSetAt: null,
      };
    }

    const plan = await this.prisma.avendorPaymentPlan.findFirst({
      where: { id: input, isActive: true },
    });
    if (!plan) {
      throw new BadRequestException('Invalid or inactive payment plan id');
    }
    return {
      paymentPlanId: plan.id,
      paymentPlanSetBy: AvendorPaymentPlanSetBy.vendor,
      paymentPlanSetAt: at,
    };
  }

  private normalizeLines(
    lines: SubmitQuoteLineDto[],
    itemMap: Map<string, { quantity: number }>,
  ) {
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new BadRequestException('At least one price line is required');
    }

    return lines.map((line, index) => {
      const rfqItem = itemMap.get(line.rfqItemId);
      if (!rfqItem) {
        throw new BadRequestException(
          `rfqItemId "${line.rfqItemId}" does not belong to this RFQ`,
        );
      }

      const pricePerUnit = Number(line.pricePerUnit);
      if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
        throw new BadRequestException('pricePerUnit must be a non-negative number');
      }

      const totalPrice =
        line.totalPrice !== undefined && line.totalPrice !== null
          ? Number(line.totalPrice)
          : pricePerUnit * rfqItem.quantity;

      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        throw new BadRequestException('totalPrice must be a non-negative number');
      }

      return {
        rfqItemId: line.rfqItemId,
        position: line.position ?? index,
        quality: line.quality?.trim() || null,
        possibleDeliveryAt: line.possibleDeliveryAt
          ? new Date(line.possibleDeliveryAt)
          : null,
        pricePerUnit,
        totalPrice,
        note: line.note?.trim() || null,
      };
    });
  }

  private async generateQuoteNumber(
    tx: Prisma.TransactionClient,
    retries = 3,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const latest = await tx.avendorVendorQuote.findFirst({
        where: { quoteNumber: { startsWith: prefix } },
        orderBy: { quoteNumber: 'desc' },
        select: { quoteNumber: true },
      });

      let seq = 1;
      if (latest?.quoteNumber) {
        const lastSeq = parseInt(latest.quoteNumber.replace(prefix, ''), 10);
        if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
      }

      const candidate = `${prefix}${seq.toString().padStart(4, '0')}`;
      const exists = await tx.avendorVendorQuote.findUnique({
        where: { quoteNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;

      this.logger.warn(
        colors.red(
          `Quote number collision on ${candidate}, retrying (${attempt + 1}/${retries})`,
        ),
      );
    }

    throw new ConflictException(
      'Unable to generate a unique quote number. Please try again.',
    );
  }

  private shapeListRow(
    row: Prisma.AvendorRfqVendorGetPayload<{
      include: {
        rfq: {
          select: {
            id: true;
            rfqNumber: true;
            title: true;
            description: true;
            dueDate: true;
            submissionDeadline: true;
            status: true;
            totalBudget: true;
            sentAt: true;
            createdAt: true;
            _count: { select: { items: true } };
            vendorQuotes: {
              select: {
                id: true;
                quoteNumber: true;
                status: true;
                totalAmount: true;
                currency: true;
                submittedAt: true;
                updatedAt: true;
                paymentPlan: { select: { id: true; name: true; code: true } };
              };
            };
          };
        };
      };
    }>,
  ) {
    const quote = row.rfq.vendorQuotes[0] ?? null;
    return {
      assignmentId: row.id,
      rfqId: row.rfq.id,
      reference: row.rfq.rfqNumber,
      title: row.rfq.title,
      description: row.rfq.description,
      itemsCount: row.rfq._count.items,
      expectedDelivery: row.rfq.dueDate,
      submissionDeadline: row.rfq.submissionDeadline ?? row.rfq.dueDate,
      rfqStatus: row.rfq.status,
      totalBudget: row.rfq.totalBudget,
      sentAt: row.sentAt ?? row.rfq.sentAt,
      myQuote: quote
        ? {
            id: quote.id,
            quoteNumber: quote.quoteNumber,
            status: quote.status,
            totalAmount: quote.totalAmount,
            currency: quote.currency,
            submittedAt: quote.submittedAt,
            updatedAt: quote.updatedAt,
            paymentPlan: quote.paymentPlan,
          }
        : null,
    };
  }

  private shapeQuote(
    quote: Prisma.AvendorVendorQuoteGetPayload<{ include: { paymentPlan: true } }>,
    lines: Prisma.AvendorVendorQuoteLineGetPayload<object>[],
  ) {
    const byItem = new Map<
      string,
      {
        rfqItemId: string;
        prices: Array<{
          id: string;
          position: number;
          quality: string | null;
          possibleDeliveryAt: Date | null;
          pricePerUnit: number;
          totalPrice: number;
          note: string | null;
        }>;
      }
    >();

    for (const line of lines) {
      let bucket = byItem.get(line.rfqItemId);
      if (!bucket) {
        bucket = { rfqItemId: line.rfqItemId, prices: [] };
        byItem.set(line.rfqItemId, bucket);
      }
      bucket.prices.push({
        id: line.id,
        position: line.position,
        quality: line.quality,
        possibleDeliveryAt: line.possibleDeliveryAt,
        pricePerUnit: line.pricePerUnit,
        totalPrice: line.totalPrice,
        note: line.note,
      });
    }

    for (const group of byItem.values()) {
      group.prices.sort((a, b) => a.position - b.position);
    }

    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      currency: quote.currency,
      totalAmount: quote.totalAmount,
      note: quote.note,
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
      submittedAt: quote.submittedAt,
      withdrawnAt: quote.withdrawnAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      itemQuotes: Array.from(byItem.values()),
    };
  }
}
