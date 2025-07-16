import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { AffiliateStatus } from '@prisma/client';
import slugify from 'slugify';
import { formatDate, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';

@Injectable()
export class ReferralsService {
    constructor(private prisma: PrismaService) {}

   

    async fetchAffiliateDashboard(page: number = 1, limit: number = 10, isUsed?: boolean) {
        console.log(colors.cyan('[referral-service] Fetching affiliate dashboard...'));
        try {
            // 1. KPI Cards
            const [
                totalRevenueAgg,
                totalAffiliates,
                totalClicks,
                totalConversions,
                pendingPayoutsAgg
            ] = await Promise.all([
                this.prisma.commissionReferral.aggregate({ _sum: { amount: true } }),
                this.prisma.affiliate.count({}),
                this.prisma.referral.count(),
                this.prisma.referral.count({ where: { isUsed: true } }),
                this.prisma.commissionReferral.aggregate({ _sum: { amount: true }, where: { status: 'awaiting_approval' } })
            ]);

            const kpiCards = {
                totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
                totalAffiliates: totalAffiliates,
                totalClicks: totalClicks,
                totalConversions: totalConversions,
                pendingPayouts: Number(pendingPayoutsAgg._sum?.amount || 0)
            };

            // 2. Affiliate Settings (mocked or configurable)
            const affiliateSettings = {
                affiliatePercentage: 10, // %
                minimumAffiliates: 1,
                rewardThreshold: 50, // ₦
                expirationDays: 30
            };

            // 3. Leaderboard (top affiliates by total earned in wallet)
            const leaderboardWallets = await this.prisma.wallet.findMany({
                orderBy: { total_earned: 'desc' },
                take: 10,
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            createdAt: true
                        }
                    }
                }
            });
            const leaderboard = await Promise.all(leaderboardWallets.map(async (w) => {
                const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: w.userId } });
                return {
                    id: w.userId,
                    name: w.user?.first_name + ' ' + w.user?.last_name,
                    email: w.user?.email,
                    totalEarned: w.total_earned,
                    status: affiliate?.status,
                    joinedAt: affiliate?.createdAt ? formatDate(affiliate.createdAt) : null
                };
            }));

            // 4. Overview (summary and trends)
            // Use 'This Year' as selected timeframe
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            const [
                yearRevenueAgg,
                yearClicks,
                yearConversions,
                yearNewAffiliates
            ] = await Promise.all([
                this.prisma.commissionReferral.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfYear, lte: endOfYear } } }),
                this.prisma.referral.count({ where: { createdAt: { gte: startOfYear, lte: endOfYear } } }),
                this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: startOfYear, lte: endOfYear } } }),
                this.prisma.affiliate.count({ where: { createdAt: { gte: startOfYear, lte: endOfYear } } })
            ]);
            // Trend data: last 12 months
            const trendData = await Promise.all(Array.from({ length: 12 }).map(async (_, i) => {
                const month = i;
                const year = now.getFullYear();
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 1);
                const revenueAgg = await this.prisma.commissionReferral.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: start, lt: end } } });
                const clicks = await this.prisma.referral.count({ where: { createdAt: { gte: start, lt: end } } });
                const conversions = await this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: start, lt: end } } });
                return {
                    date: start.toISOString().slice(0, 7), // YYYY-MM
                    revenue: Number(revenueAgg._sum.amount || 0),
                    clicks,
                    conversions
                };
            }));
            const overview = {
                timeframes: ['Today', 'This Week', 'This Month', 'This Year'],
                selectedTimeframe: 'This Year',
                summary: {
                    revenue: Number(yearRevenueAgg._sum.amount || 0),
                    clicks: yearClicks,
                    conversions: yearConversions,
                    newAffiliates: yearNewAffiliates
                },
                trendData
            };

            // 5. Payouts (pending and completed commissions)
            const payoutsRaw = await this.prisma.withdrawalRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const payouts = await Promise.all(payoutsRaw.map(async (p) => {
                const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: p.userId } });
                
                // Fetch all withdrawal requests for this affiliate
                const withdrawalRequests = await this.prisma.withdrawalRequest.findMany({
                  where: { userId: p.userId },
                  include: {
                    bank: {
                      select: {
                        bankName: true,
                        accountNumber: true,
                        accountName: true,
                        bankCode: true
                      }
                    }
                  }
                });

                return {
                    payoutId: p.id,
                    affiliateId: p.userId,
                    affiliateName: affiliate?.userName || '',
                    amount: Number(p.withdrawal_amount),
                    status: p.payoutStatus,
                    requestedAt: p.createdAt?.toISOString(),
                    paidAt: p.payoutStatus === 'paid' ? p.updatedAt?.toISOString() : null,
                    // Bank account details
                    accountDetails: (withdrawalRequests.length > 0 && withdrawalRequests[0].bank) ? {
                        bankName: withdrawalRequests[0].bank?.bankName,
                        accountNumber: withdrawalRequests[0].bank?.accountNumber,
                        accountName: withdrawalRequests[0].bank?.accountName,
                        bankCode: withdrawalRequests[0].bank?.bankCode
                    } : null,
                    payoutMethod: withdrawalRequests.length > 0 ? withdrawalRequests[0].payoutMethod || null : null,
                    withdrawalStatus: withdrawalRequests.length > 0 ? withdrawalRequests[0].payoutStatus || null : null
                };
            }));

            const withdrawalRequests = await this.prisma.withdrawalRequest.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      email: true,
                      phone_number: true
                    }
                  },
                  bank: {
                    select: {
                      bankName: true,
                      accountNumber: true,
                      accountName: true,
                      bankCode: true
                    }
                  }
                }
            });

            const formatted_withdrawal_request = withdrawalRequests.map(w => ({
              id: w.id,
              payoutId: w.payoutId,
              userId: w.userId,
              user: w.user,
              amount: w.commissionAmount ?? w.withdrawal_amount ?? 0,
              payoutMethod: w.payoutMethod,
              payoutStatus: w.payoutStatus,
              bank: w.bank,
              reference: w.reference,
              requestedAt: w.createdAt ? formatDateWithoutTime(w.createdAt) : '',
              processedAt: w.updatedAt ? formatDateWithoutTime(w.updatedAt) : '',
              processedBy: w.processedBy,
              notes: w.notes,
              rejectionReason: w.rejectionReason
            }));

            // 6. Events (recent affiliate-related events)
            const eventsRaw = await this.prisma.referral.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const events = await Promise.all(eventsRaw.map(async (evt) => {
                const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: evt.referrerId } });
                return {
                    eventId: evt.id,
                    type: evt.isUsed ? 'conversion' : 'click',
                    affiliateId: evt.referrerId,
                    affiliateName: affiliate?.userName || '',
                    timestamp: evt.createdAt.toISOString(),
                    details: evt.isUsed ? 'User signed up via referral link' : 'Referral link clicked'
                };
            }));

            // // 7. Analytics (conversion rate, avg order value, top sources, geo)
            // const [totalReferrals, usedReferrals, avgOrderAgg] = await Promise.all([
            //     this.prisma.referral.count(),
            //     this.prisma.referral.count({ where: { isUsed: true } }),
            //     this.prisma.order.aggregate({ _avg: { total: true } })
            // ]);
            // const conversionRate = totalReferrals > 0 ? (usedReferrals / totalReferrals) * 100 : 0;
            // // Top sources (mocked, as no source field in schema)
            // const topSources = [
            //     { source: 'Facebook', clicks: 5000, conversions: 120 },
            //     { source: 'Twitter', clicks: 3000, conversions: 60 }
            // ];
            // // Geo distribution (mocked, as no geo field in schema)
            // const geoDistribution = [
            //     { country: 'Nigeria', clicks: 7000, conversions: 150 },
            //     { country: 'Ghana', clicks: 3000, conversions: 60 }
            // ];
            // const analytics = {
            //     conversionRate: Number(conversionRate.toFixed(2)),
            //     averageOrderValue: Number(avgOrderAgg._avg.total || 0),
            //     topSources,
            //     geoDistribution
            // };

            // Final formatted response
            const formattedResponse = {
                kpiCards,
                affiliateSettings,
                leaderboard,
                overview,
                payouts,
                formatted_withdrawal_request,
                events,
                // analytics
            };

            console.log(colors.magenta("Affiliate dashboard successfully returned"))
            return {
                success: true,
                message: 'Affiliate dashboard fetched successfully.',
                data: formattedResponse
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate dashboard:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate dashboard.',
                data: null
            }; 
        }
    }

    async fetchAllAffiliates(page: number = 1, limit: number = 20, status?: string) {
        console.log(colors.cyan('Fetching all affiliates...'), status);
        try {
            const skip = (page - 1) * limit;
            // Allowed statuses from AffiliateStatus enum
            const allowedStatuses = [
                AffiliateStatus.not_affiliate,
                AffiliateStatus.awaiting_approval,
                AffiliateStatus.pending,
                AffiliateStatus.approved,
                AffiliateStatus.rejected,
                AffiliateStatus.active,
                AffiliateStatus.inactive
            ];
            let whereClause;
            if (status) {
                if (!allowedStatuses.includes(status as AffiliateStatus)) {
                    return {
                        success: false,
                        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                        data: null
                    };
                }
                whereClause = { status: status as AffiliateStatus };
            } else {
                whereClause = {
                    OR: [
                        { status: AffiliateStatus.approved },
                        { status: AffiliateStatus.active }
                    ]
                };
            }
            const [affiliates, total] = await Promise.all([
                this.prisma.affiliate.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true,
                                isAffiliate: true,
                                affiliateStatus: true,
                                createdAt: true
                            }
                        }
                    }
                }),
                this.prisma.affiliate.count({ where: whereClause })
            ]);
            const totalPages = Math.ceil(total / limit);
            const formattedAffiliates = affiliates.map(aff => ({
                id: aff.id,
                userId: aff.userId,
                name: aff.userName,
                email: aff.userEmail,
                status: aff.status,
                requestedAt: aff.requestedAt,
                category: aff.category,
                reason: aff.reason,
                reviewedAt: aff.reviewedAt,
                reviewedByName: aff.reviewedByName,
                reviewedByEmail: aff.reviewedByEmail,
                notes: aff.notes,
                user: aff.user
            }));
            return {
                success: true,
                message: 'Affiliates fetched successfully.',
                data: {
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    affiliates: formattedAffiliates,
                }
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliates:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliates.',
                data: null
            };
        }
    }

    async updateAffiliateStatus(affiliateId: string, newStatus: string) {

        console.log(colors.cyan(`Updating affiliate status for ${affiliateId} to ${newStatus}`));
        // List of allowed statuses from schema.prisma AffiliateStatus enum
        const allowedStatuses = [
            'not_affiliate',
            'awaiting_approval',
            'pending',
            'approved',
            'rejected',
            'active',
            'inactive'
        ];
        if (!allowedStatuses.includes(newStatus.toLowerCase())) {
            console.log(colors.red(`Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`))
            return {
                success: false,
                message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                data: null
            };
        }
        try {
            // Check if affiliate record exists
            const affiliateRecord = await this.prisma.affiliate.findFirst({ where: { id: affiliateId } });
            if (!affiliateRecord) {
                console.log(colors.red('Affiliate record not found.'))
                return {
                    success: false,
                    message: 'Affiliate record not found.',
                    data: null
                };
            }
            // Update affiliate record
            const updated = await this.prisma.affiliate.update({
                where: { id: affiliateId },
                data: { status: newStatus as AffiliateStatus }
            });
            // Determine isAffiliate value
            const isAffiliate = (newStatus === 'approved' || newStatus === 'active');
            // Update the affiliateStatus and isAffiliate in the related use r record
            await this.prisma.user.update({
                where: { id: updated.userId },
                data: {
                    affiliateStatus: newStatus as AffiliateStatus,
                    isAffiliate: isAffiliate
                }
            });

            console.log(colors.magenta(`Affiliate status updated to ${newStatus}`))
            return {
                success: true,
                message: `Affiliate status updated to ${newStatus}`,
                data: updated
            };
        } catch (error) {
            console.log(colors.red('Error updating affiliate status:'), error);
            return {
                success: false,
                message: 'Failed to update affiliate status.',
                data: null
            };
        }
    }

    /**
     * Generate a unique affiliate link for a user and product
     */
    async generateAffiliateLink(userId: string, productId: string) {
        console.log(colors.cyan("generating affiliate link"));
        try {
            // Check if user is an approved/active affiliate
            const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
            if (!affiliate || !(affiliate.status === AffiliateStatus.approved || affiliate.status === AffiliateStatus.active)) {
                console.log(colors.red('User is not an approved or active affiliate.'));
                return {
                    success: false,
                    message: 'User is not an approved or active affiliate.',
                    data: null
                };
            } 
            // Check if product exists
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            if (!product) {
                console.log(colors.red('Product not found.'));
                return {
                    success: false,
                    message: 'Product not found.',
                    data: null
                };
            }
            // Check if link already exists for this user-product
            const existing = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
            if (existing) {
                console.log(colors.yellow('Affiliate link already exists.'));
                return {
                    success: true,
                    message: 'Affiliate link already exists.', 
                    data: existing 
                };
            }
            // Generate a unique slug
            let slug = `${userId.slice(0, 6)}-${productId.slice(0, 6)}-${Math.random()
                .toString(36)
                .substring(2, 7)}`;

            // Still check for uniqueness (though very unlikely to need this)
            let i = 1;
            while (await this.prisma.affiliateLink.findUnique({ where: { slug } })) {
                slug = `${userId.slice(0, 6)}-${productId.slice(0, 6)}-${Math.random()
                    .toString(36)
                    .substring(2, 7)}-${i++}`;
            }
            // Create the link
            const link = await this.prisma.affiliateLink.create({
                data: {
                    userId,
                    productId,
                    slug
                }
            });
            // Construct shareable link
            const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
            const productSlug = product.id;
            const shareableLink = `${baseUrl}/product/${productSlug}?ref=${link.slug}`;
            console.log(colors.green('Affiliate link generated successfully.'));
            return {
                success: true,
                message: 'Affiliate link generated successfully.',
                data: {
                    ...link,
                    shareableLink
                }
            };
        } catch (error) {
            console.log(colors.red('Error generating affiliate link:'), error);
            return {
                success: false, 
                message: 'Failed to generate affiliate link.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Get all affiliate links for a user
     */
    async getAffiliateLinksForUser(userId: string) {
        console.log(colors.cyan('Fetching affiliate links for user...'));
        try {
            const links = await this.prisma.affiliateLink.findMany({
                where: { userId },
                include: {
                    product: true
                }
            });
            console.log(colors.green('Affiliate links fetched successfully.'));
            return {
                success: true,
                message: 'Affiliate links fetched successfully.',
                data: links
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate links:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate links.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Track a click on an affiliate link (by slug)
     */
    async trackAffiliateLinkClick(slug: string) {
        console.log(colors.cyan('Tracking click for affiliate link...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                console.log(colors.red('Affiliate link not found.'));
                return {
                    success: false,
                    message: 'Affiliate link not found.',
                    data: null
                };
            }
            await this.prisma.affiliateLink.update({
                where: { slug },
                data: { clicks: { increment: 1 } }
            });
            console.log(colors.green('Click tracked.'));
            return {
                success: true,
                message: 'Click tracked.',
                data: null
            };
        } catch (error) {
            console.log(colors.red('Error tracking click:'), error);
            return {
                success: false,
                message: 'Failed to track click.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Track a conversion/order for an affiliate link (by slug)
     * Optionally increment commission
     */
    async trackAffiliateLinkConversion(slug: string, orderId: string, commissionAmount: number = 0) {
        console.log(colors.cyan('Tracking conversion for affiliate link...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                console.log(colors.red('Affiliate link not found.'));
                return {
                    success: false,
                    message: 'Affiliate link not found.',
                    data: null
                };
            }
            await this.prisma.affiliateLink.update({
                where: { slug },
                data: {
                    orders: { increment: 1 },
                    commission: { increment: commissionAmount }
                }
            });
            // Optionally, you can also create a record in a conversion table or log
            console.log(colors.green('Conversion tracked.'));
            return {
                success: true,
                message: 'Conversion tracked.',
                data: null
            };
        } catch (error) {
            console.log(colors.red('Error tracking conversion:'), error);
            return {
                success: false,
                message: 'Failed to track conversion.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Get affiliate link for a user and product
     */
    async getAffiliateLinkForUserAndProduct(userId: string, productId: string) {
        console.log(colors.cyan('Fetching affiliate link for user and product...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
            if (!link) {
                return {
                    success: true,
                    message: 'No affiliate link found for this user and product.',
                    data: null
                };
            }
            // Get product for shareable link
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
            const productSlug = product?.id;
            const shareableLink = `${baseUrl}/product/${productSlug}?ref=${link.slug}`;
            return {
                success: true,
                message: 'Affiliate link found.',
                data: {
                    ...link,
                    shareableLink
                }
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate link for user and product:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate link for user and product.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Fetch all commission payouts (admin)
     */
    async fetchAllCommissionPayouts() {

        console.log(colors.cyan("fetching all commission oayouts for a user"))

        try {
            const payouts = await this.prisma.commissionPayout.findMany({
                orderBy: { requestedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                }
            });

            console.log(colors.magenta("commission payouts fetched successfully"))

            return {
                success: true,
                message: 'Commission payouts fetched successfully.',
                data: payouts
            };
        } catch (error) {

            console.log(colors.red("Failed to fetch commission payouts"), error)
            return {
                success: false,
                message: 'Failed to fetch commission payouts.',
                data: null,
                error: error?.message || error
            };
        }
    }

    async updateWithdrawalStatus(dto: UpdateWithdrawalStatusDto, req: any) {
        console.log(colors.cyan(`Updating payout status for ${dto.withdrawalId} to ${dto.status}`));
        
        // List of allowed payout statuses from WithdrawalStatus enum
        const allowedStatuses = [
            'not_requested',
            'pending',
            'paid',
            'cancelled'
        ];
        
        if (!allowedStatuses.includes(dto.status.toLowerCase())) {
            console.log(colors.red(`Invalid payout status. Allowed statuses: ${allowedStatuses.join(', ')}`));
            return {
                success: false,
                message: `Invalid payout status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                data: null
            };
        }

        try {
            // Check if withdrawal request exists
            const withdrawalRequest = await this.prisma.withdrawalRequest.findUnique({
                where: { id: dto.withdrawalId },
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    },
                    commission: true,
                    bank: true
                }
            });

            if (!withdrawalRequest) {
                console.log(colors.red('Withdrawal request not found.'));
                return {
                    success: false,
                    message: 'Withdrawal request not found.',
                    data: null
                };
            }

            // Prepare update data
            const updateData: any = {
                payoutStatus: dto.status as any,
                processedAt: new Date(),
                processedBy: req.user
            };

            // Add notes if provided
            if (dto.notes) {
                updateData.notes = dto.notes;
            }

            // Add rejection reason if status is cancelled
            if (dto.status === 'cancelled' && dto.notes) {
                updateData.rejectionReason = dto.notes;
            }

            // Update withdrawal request
            const updatedWithdrawalRequest = await this.prisma.withdrawalRequest.update({
                where: { id: dto.withdrawalId },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    },
                    commission: true,
                    bank: true
                }
            });

            // If payout is approved (paid), also update the commission status
            // if (dto.status === 'paid' ) {
            //     await this.prisma.commission.update({
            //         where: { id: withdrawalRequest.commissionId },
            //         data: { status: 'paid' }
            //     });
            //     console.log(colors.yellow(`Commission status updated to paid for commission ID: ${withdrawalRequest.commissionId}`));
            // }

            // If payout is cancelled, also update the commission status back to pending
            // if (payoutStatus === 'cancelled' && withdrawalRequest.commissionId) {
            //     await this.prisma.commission.update({
            //         where: { id: withdrawalRequest.commissionId },
            //         data: { status: 'pending' }
            //     });
            //     console.log(colors.yellow(`Commission status reverted to pending for commission ID: ${withdrawalRequest.commissionId}`));
            // }

            console.log(colors.magenta(`Payout status updated to ${dto.status} successfully`));
            
            return {
                success: true,
                message: `Payout status updated to ${dto.status} successfully`,
                data: {
                    id: updatedWithdrawalRequest.id,
                    payoutId: updatedWithdrawalRequest.payoutId,
                    userId: updatedWithdrawalRequest.userId,
                    user: updatedWithdrawalRequest.user,
                    commissionAmount: updatedWithdrawalRequest.commissionAmount,
                    payoutStatus: updatedWithdrawalRequest.payoutStatus,
                    payoutMethod: updatedWithdrawalRequest.payoutMethod,
                    bankDetails: updatedWithdrawalRequest.bank ? {
                        bankName: updatedWithdrawalRequest.bank.bankName,
                        accountNumber: updatedWithdrawalRequest.bank.accountNumber,
                        accountName: updatedWithdrawalRequest.bank.accountName,
                        bankCode: updatedWithdrawalRequest.bank.bankCode
                    } : null,
                    processedAt: updatedWithdrawalRequest.processedAt,
                    processedBy: updatedWithdrawalRequest.processedBy,
                    notes: updatedWithdrawalRequest.notes,
                    rejectionReason: updatedWithdrawalRequest.rejectionReason
                }
            };
        } catch (error) {
            console.log(colors.red('Error updating payout status:'), error);
            return {
                success: false,
                message: 'Failed to update payout status.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Fetch all withdrawal requests with filtering and pagination
     */
    async fetchAllWithdrawalRequests(page: number = 1, limit: number = 20, status?: string) {
        console.log(colors.cyan('Fetching all withdrawal requests...'), { page, limit, status });
        
        try {
            const skip = (page - 1) * limit;
            
            // Allowed statuses from WithdrawalStatus enum
            const allowedStatuses = [
                'not_requested',
                'pending',
                'paid',
                'cancelled'
            ];

            let whereClause: any = {};
            
            if (status) {
                if (!allowedStatuses.includes(status.toLowerCase())) {
                    return {
                        success: false,
                        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                        data: null
                    };
                }
                whereClause.payoutStatus = status;
            }

            const [withdrawalRequests, total] = await Promise.all([
                this.prisma.withdrawalRequest.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    orderBy: { requestedAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true
                            }
                        },
                        commission: true,
                        bank: {
                            select: {
                                bankName: true,
                                accountNumber: true,
                                accountName: true,
                                bankCode: true
                            }
                        },
                        order: {
                            select: {
                                id: true,
                                // orderId: true,
                                total: true,
                                status: true
                            }
                        }
                    }
                }),
                this.prisma.withdrawalRequest.count({ where: whereClause })
            ]);

            const totalPages = Math.ceil(total / limit);

            const formattedRequests = withdrawalRequests.map(request => ({
                id: request.id,
                payoutId: request.payoutId,
                userId: request.userId,
                user: request.user,
                orderId: request.orderId,
                order: request.order,
                commissionId: request.commissionId,
                commission: request.commission,
                buyerName: request.buyerName,
                buyerEmail: request.buyerEmail,
                totalPurchaseAmount: request.totalPurchaseAmount,
                commissionAmount: request.commissionAmount,
                commissionPercentage: request.commissionPercentage,
                payoutMethod: request.payoutMethod,
                payoutStatus: request.payoutStatus,
                bankDetails: request.bank,
                reference: request.reference,
                requestedAt: request.requestedAt,
                processedAt: request.processedAt,
                processedBy: request.processedBy,
                notes: request.notes,
                rejectionReason: request.rejectionReason
            }));

            console.log(colors.magenta(`Withdrawal requests fetched successfully. Total: ${total}`));

            return {
                success: true,
                message: 'Withdrawal requests fetched successfully.',
                data: {
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    withdrawalRequests: formattedRequests
                }
            };
        } catch (error) {
            console.log(colors.red('Error fetching withdrawal requests:'), error);
            return {
                success: false,
                message: 'Failed to fetch withdrawal requests.',
                data: null,
                error: error?.message || error
            };
        }
    }
} 