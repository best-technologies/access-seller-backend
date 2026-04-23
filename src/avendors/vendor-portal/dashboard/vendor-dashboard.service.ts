import { Injectable, Logger } from '@nestjs/common';
import {
  AvendorPaymentApprovalStatus,
  AvendorRfqStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { computeProfileCompletion } from '../profile/vendor-profile-completion.constants';
import * as colors from 'colors';

const RECENT_QUOTE_DEFAULT_LIMIT = 5;
const RECENT_QUOTE_MAX_LIMIT = 20;

@Injectable()
export class VendorDashboardService {
  private readonly logger = new Logger(VendorDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, vendorId: string, limit?: number) {
    this.logger.log(
      colors.blue(`Building dashboard summary user=${userId} vendor=${vendorId}`),
    );

    const recentLimit = Math.max(
      1,
      Math.min(RECENT_QUOTE_MAX_LIMIT, limit ?? RECENT_QUOTE_DEFAULT_LIMIT),
    );

    const [
      activeQuoteRequests,
      acceptedQuotes,
      totalInventory,
      approvedPaymentAgg,
      recentRfqAssignments,
      vendor,
      user,
      bankCount,
      documents,
    ] = await Promise.all([
      this.prisma.avendorRfqVendor.count({
        where: {
          vendorId,
          rfq: {
            status: {
              in: [AvendorRfqStatus.sent, AvendorRfqStatus.awaiting_selection],
            },
          },
        },
      }),
      this.prisma.avendorRfq.count({
        where: {
          awardedVendorId: vendorId,
          status: AvendorRfqStatus.awarded,
        },
      }),
      this.prisma.avendorVendorInventoryItem.count({ where: { vendorId } }),
      this.prisma.avendorVendorApprovedPayment.aggregate({
        where: {
          vendorId,
          status: AvendorPaymentApprovalStatus.approved,
        },
        _sum: { amount: true },
      }),
      this.prisma.avendorRfqVendor.findMany({
        where: {
          vendorId,
          rfq: {
            status: {
              in: [
                AvendorRfqStatus.sent,
                AvendorRfqStatus.awaiting_selection,
                AvendorRfqStatus.awarded,
              ],
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: recentLimit,
        include: {
          rfq: {
            include: { items: { select: { id: true } } },
          },
        },
      }),
      this.prisma.avendorVendor.findUnique({
        where: { id: vendorId },
        select: {
          name: true,
          industry: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true, last_name: true },
      }),
      this.prisma.avendorVendorBank.count({ where: { vendorId } }),
      this.prisma.avendorVendorDocument.findMany({
        where: { vendorId },
        select: { status: true, expiresAt: true },
      }),
    ]);

    const completion = computeProfileCompletion({
      vendor: {
        name: vendor?.name ?? null,
        industry: vendor?.industry ?? null,
        phone: vendor?.phone ?? null,
        address: vendor?.address ?? null,
        city: vendor?.city ?? null,
        country: vendor?.country ?? null,
      },
      hasBank: bankCount > 0,
      documents: documents.map((d) => ({ status: d.status, expiresAt: d.expiresAt })),
      userEmail: user?.email ?? null,
    });

    const recentQuoteRequests = recentRfqAssignments.map((row) => ({
      rfqId: row.rfq.id,
      reference: row.rfq.rfqNumber,
      title: row.rfq.title,
      itemsCount: row.rfq.items.length,
      expectedDelivery: row.rfq.dueDate,
      submissionDeadline: row.rfq.submissionDeadline ?? row.rfq.dueDate,
      status: row.rfq.status,
      sentAt: row.sentAt,
    }));

    const payload = {
      kpis: {
        activeQuoteRequests,
        acceptedQuotes,
        totalInventory,
        totalApprovedPayment: {
          amount: approvedPaymentAgg._sum.amount ?? 0,
          currency: 'NGN',
        },
      },
      profileBanner: {
        completionPercent: completion.completionPercent,
        missingItems: completion.missingItems,
        completedItems: completion.completedItems,
        message:
          completion.completionPercent >= 100
            ? 'Your profile is complete. Great work!'
            : 'Complete your profile to get more quote opportunities.',
        ctaLabel:
          completion.completionPercent >= 100 ? 'Review profile' : 'Complete profile',
      },
      recentQuoteRequests,
      greeting: {
        firstName: user?.first_name ?? null,
        lastName: user?.last_name ?? null,
        companyName: vendor?.name ?? null,
      },
    };

    this.logger.log(
      colors.green(
        `Dashboard summary built vendor=${vendorId} active=${activeQuoteRequests} accepted=${acceptedQuotes} recent=${recentQuoteRequests.length}`,
      ),
    );
    return ResponseHelper.success('Dashboard summary retrieved', payload);
  }
}
