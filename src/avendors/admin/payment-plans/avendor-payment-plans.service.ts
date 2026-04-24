import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AvendorModuleAccessLevel, AvendorPaymentPlanSetBy, Prisma } from '@prisma/client';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { ListPaymentPlansQueryDto } from './dto/list-payment-plans-query.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';
import { SetVendorQuotePaymentPlanBodyDto } from '../../shared/dto/set-vendor-quote-payment-plan.dto';

export type AvendorPaymentPlanCaller = { id: string; role: string };

@Injectable()
export class AvendorPaymentPlansService {
  private readonly logger = new Logger(AvendorPaymentPlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CATALOG CRUD ────────────────────────────────────────

  async listPlans(query: ListPaymentPlansQueryDto, caller: AvendorPaymentPlanCaller) {
    await this.assertCanViewRfqs(caller);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const includeInactive = query.includeInactive === true;

    const where: Prisma.AvendorPaymentPlanWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.avendorPaymentPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.avendorPaymentPlan.count({ where }),
    ]);

    this.logger.log(
      colors.magenta(`Payment plans listed: ${rows.length}/${total} includeInactive=${includeInactive}`),
    );

    return ResponseHelper.success('Payment plans retrieved', rows, {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + rows.length < total,
      hasPrevPage: page > 1,
    });
  }

  async getPlan(id: string, caller: AvendorPaymentPlanCaller) {
    await this.assertCanViewRfqs(caller);
    const plan = await this.prisma.avendorPaymentPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Payment plan not found');
    }
    return ResponseHelper.success('Payment plan retrieved', plan);
  }

  async createPlan(dto: CreatePaymentPlanDto, caller: AvendorPaymentPlanCaller) {
    await this.assertCanEditRfqs(caller);
    const name = dto.name.trim();
    const code = dto.code?.trim() || null;

    if (code) {
      const taken = await this.prisma.avendorPaymentPlan.findUnique({
        where: { code },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException(`Code "${code}" is already in use`);
      }
    }

    const plan = await this.prisma.avendorPaymentPlan.create({
      data: {
        name,
        code,
        description: dto.description?.trim() || null,
        netDays: dto.netDays ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(colors.green(`Payment plan created id=${plan.id} name="${plan.name}"`));
    return ResponseHelper.created('Payment plan created', plan);
  }

  async updatePlan(id: string, dto: UpdatePaymentPlanDto, caller: AvendorPaymentPlanCaller) {
    await this.assertCanEditRfqs(caller);
    const existing = await this.prisma.avendorPaymentPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Payment plan not found');
    }

    if (dto.code !== undefined) {
      const next = dto.code === null || dto.code === '' ? null : dto.code.trim();
      if (next) {
        const taken = await this.prisma.avendorPaymentPlan.findFirst({
          where: { code: next, NOT: { id } },
          select: { id: true },
        });
        if (taken) {
          throw new ConflictException(`Code "${next}" is already in use`);
        }
      }
    }

    const plan = await this.prisma.avendorPaymentPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.code !== undefined && {
          code: dto.code === null || dto.code === '' ? null : dto.code.trim(),
        }),
        ...(dto.description !== undefined && {
          description: dto.description === null || dto.description === '' ? null : dto.description.trim(),
        }),
        ...(dto.netDays !== undefined && { netDays: dto.netDays }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(colors.green(`Payment plan updated id=${id}`));
    return ResponseHelper.success('Payment plan updated', plan);
  }

  async deletePlan(id: string, caller: AvendorPaymentPlanCaller) {
    await this.assertCanEditRfqs(caller);
    const plan = await this.prisma.avendorPaymentPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Payment plan not found');
    }
    // Soft delete so historical quotes keep a readable name via FK? FK is
    // SetNull on quote — if we hard-delete, we must not break quotes.
    // Keep soft delete only.
    await this.prisma.avendorPaymentPlan.update({
      where: { id },
      data: { isActive: false },
    });
    this.logger.log(colors.yellow(`Payment plan deactivated id=${id}`));
    return ResponseHelper.success('Payment plan deactivated', { id, isActive: false });
  }

  // ─── ADMIN: SET PLAN ON A VENDOR QUOTE ───────────────────

  /**
   * A-Vendor staff can set or clear the payment plan on any vendor quote.
   * `paymentPlanId` of `null` clears the plan; must be the explicit null in JSON
   * (or use vendor portal PATCH which matches the same rules).
   */
  async setPaymentPlanOnQuote(
    quoteId: string,
    dto: SetVendorQuotePaymentPlanBodyDto,
    caller: AvendorPaymentPlanCaller,
  ) {
    await this.assertCanEditRfqs(caller);

    const quote = await this.prisma.avendorVendorQuote.findUnique({
      where: { id: quoteId },
      include: { rfq: { select: { id: true, rfqNumber: true, status: true } } },
    });
    if (!quote) {
      throw new NotFoundException('Vendor quote not found');
    }

    if (quote.rfq.status === 'cancelled') {
      throw new BadRequestException('RFQ is cancelled; payment plan cannot be changed');
    }

    const now = new Date();
    if (dto.paymentPlanId === null) {
      const updated = await this.prisma.avendorVendorQuote.update({
        where: { id: quoteId },
        data: {
          paymentPlan: { disconnect: true },
          paymentPlanSetBy: AvendorPaymentPlanSetBy.admin,
          paymentPlanSetAt: now,
        },
        include: { paymentPlan: true, lines: true },
      });
      this.logger.log(colors.green(`Admin cleared payment plan on quote ${quote.quoteNumber}`));
      return ResponseHelper.success('Payment plan cleared', this.shapeQuoteForAdminResponse(updated));
    }

    const plan = await this.prisma.avendorPaymentPlan.findFirst({
      where: { id: dto.paymentPlanId, isActive: true },
    });
    if (!plan) {
      throw new BadRequestException('Payment plan not found or is inactive');
    }

    const updated = await this.prisma.avendorVendorQuote.update({
      where: { id: quoteId },
      data: {
        paymentPlan: { connect: { id: plan.id } },
        paymentPlanSetBy: AvendorPaymentPlanSetBy.admin,
        paymentPlanSetAt: now,
      },
      include: { paymentPlan: true, lines: { orderBy: [{ rfqItemId: 'asc' }, { position: 'asc' }] } },
    });

    this.logger.log(
      colors.green(`Admin set payment plan on quote ${quote.quoteNumber} plan=${plan.name}`),
    );
    return ResponseHelper.success('Payment plan updated on quote', this.shapeQuoteForAdminResponse(updated));
  }

  private shapeQuoteForAdminResponse(
    quote: Prisma.AvendorVendorQuoteGetPayload<{
      include: { paymentPlan: true; lines: true };
    }>,
  ) {
    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      rfqId: quote.rfqId,
      vendorId: quote.vendorId,
      status: quote.status,
      currency: quote.currency,
      totalAmount: quote.totalAmount,
      note: quote.note,
      paymentPlan: quote.paymentPlan
        ? {
            id: quote.paymentPlan.id,
            name: quote.paymentPlan.name,
            code: quote.paymentPlan.code,
            netDays: quote.paymentPlan.netDays,
            description: quote.paymentPlan.description,
          }
        : null,
      paymentPlanSetBy: quote.paymentPlanSetBy,
      paymentPlanSetAt: quote.paymentPlanSetAt,
      lineCount: quote.lines.length,
    };
  }

  // ─── AUTHORIZATION (reuse RFQ permissions — plans are part of quote flow) ─

  private async assertCanViewRfqs(caller: AvendorPaymentPlanCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { rfqs: true },
    });
    if (!perm || perm.rfqs === AvendorModuleAccessLevel.no_access) {
      throw new ForbiddenException(
        'You need at least view access to A-Vendor RFQs to perform this action.',
      );
    }
  }

  private async assertCanEditRfqs(caller: AvendorPaymentPlanCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { rfqs: true },
    });
    if (!perm || perm.rfqs !== AvendorModuleAccessLevel.full_access) {
      throw new ForbiddenException(
        'You need full access to A-Vendor RFQs to manage payment plans or set plans on quotes.',
      );
    }
  }
}
