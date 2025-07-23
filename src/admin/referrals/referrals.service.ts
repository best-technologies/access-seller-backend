import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AffiliateStatus, WithdrawalStatus, CommissionStatus, CommissionReferralStatus } from '@prisma/client';
import { formatDate, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { ChangeCommissionReferralStatusDto } from './dto/change-commission-referral-status.dto';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { sendCommissionApprovedMail } from 'src/common/mailer/send-mail';

@Injectable()
export class ReferralsService {
    private readonly logger = new Logger(ReferralsService.name);
    constructor(private prisma: PrismaService) {}

   

    async fetchAffiliateDashboard(page: number = 1, limit: number = 10, isUsed?: boolean) {
        this.logger.log('[referral-service] Fetching affiliate dashboard...');
        try {
            // 1. KPI Cards
            const [
                totalRevenueAgg,
                totalAffiliatesKPI,
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
                totalAffiliates: totalAffiliatesKPI,
                totalClicks: totalClicks,
                totalConversions: totalConversions,
                pendingPayouts: Number(pendingPayoutsAgg._sum?.amount || 0)
            };

            // 2. Affiliate Settings (mocked for now)
            const affiliateSettings = {
                affiliatePercentage: 10,
                minimumAffiliates: 1,
                rewardThreshold: 50,
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
                },
                where: {
                    user: {
                        isAffiliate: true,
                        affiliateStatus: 'approved',
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
            // const startOfYear = new Date(now.getFullYear(), 0, 1);
            // const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            // const [
            //     yearRevenueAgg,
            //     yearClicks,
            //     yearConversions,
            //     yearNewAffiliates
            // ] = await Promise.all([
            //     this.prisma.commissionReferral.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfYear, lte: endOfYear } } }),
            //     this.prisma.referral.count({ where: { createdAt: { gte: startOfYear, lte: endOfYear } } }),
            //     this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: startOfYear, lte: endOfYear } } }),
            //     this.prisma.affiliate.count({ where: { createdAt: { gte: startOfYear, lte: endOfYear } } })
            // ]);
            // Trend data: last 12 months
            // const trendData = await Promise.all(Array.from({ length: 12 }).map(async (_, i) => {
            //     const month = i;
            //     const year = now.getFullYear();
            //     const start = new Date(year, month, 1);
            //     const end = new Date(year, month + 1, 1);
            //     const revenueAgg = await this.prisma.commissionReferral.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: start, lt: end } } });
            //     const clicks = await this.prisma.referral.count({ where: { createdAt: { gte: start, lt: end } } });
            //     const conversions = await this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: start, lt: end } } });
            //     return {
            //         date: start.toISOString().slice(0, 7), // YYYY-MM
            //         revenue: Number(revenueAgg._sum.amount || 0),
            //         clicks,
            //         conversions
            //     };
            // }));
            // const overview = {
            //     timeframes: ['Today', 'This Week', 'This Month', 'This Year'],
            //     selectedTimeframe: 'This Year',
            //     summary: {
            //         revenue: Number(yearRevenueAgg._sum.amount || 0),
            //         clicks: yearClicks,
            //         conversions: yearConversions,
            //         newAffiliates: yearNewAffiliates
            //     },
            //     trendData
            // };

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
            // const events = await Promise.all(eventsRaw.map(async (evt) => {
            //     const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: evt.referrerId } });
            //     return {
            //         eventId: evt.id,
            //         type: evt.isUsed ? 'conversion' : 'click',
            //         affiliateId: evt.referrerId,
            //         affiliateName: affiliate?.userName || '',
            //         timestamp: evt.createdAt.toISOString(),
            //         details: evt.isUsed ? 'User signed up via referral link' : 'Referral link clicked'
            //     };
            // }));

            // Final formatted response
            const formattedResponse = {
                kpiCards,
                affiliateSettings,
                leaderboard,
                // overview,
                payouts,
                formatted_withdrawal_request,
                // events,
                // analytics
            };

            this.logger.log("Affiliate dashboard successfully returned")
            return {
                success: true,
                message: 'Affiliate dashboard fetched successfully.',
                data: formattedResponse
            };
        } catch (error) {
            this.logger.error('Error fetching affiliate dashboard:', error);
            return {
                success: false,
                message: 'Failed to fetch affiliate dashboard.',
                data: null
            }; 
        }
    }

    // 

    async fetchAllAffiliates(page: number = 1, limit: number = 20, status?: string) {
        this.logger.log(`Fetching all affiliates... ${status}`);
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
            this.logger.error('Error fetching affiliates:', error);
            return {
                success: false,
                message: 'Failed to fetch affiliates.',
                data: null
            };
        }
    }

    async updateAffiliateStatus(affiliateId: string, newStatus: string) {

        this.logger.log(`Updating affiliate status for ${affiliateId} to ${newStatus}`);
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
            this.logger.warn(`Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`)
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
                this.logger.warn('Affiliate record not found.')
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

            this.logger.log(`Affiliate status updated to ${newStatus}`)
            return {
                success: true,
                message: `Affiliate status updated to ${newStatus}`,
                data: updated
            };
        } catch (error) {
            this.logger.error('Error updating affiliate status:', error);
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
        this.logger.log("generating affiliate link");
        try {
            // Check if user is an approved/active affiliate
            const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
            if (!affiliate || !(affiliate.status === AffiliateStatus.approved || affiliate.status === AffiliateStatus.active)) {
                this.logger.warn('User is not an approved or active affiliate.');
                return {
                    success: false,
                    message: 'User is not an approved or active affiliate.',
                    data: null
                };
            } 
            // Check if product exists
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            if (!product) {
                this.logger.warn('Product not found.');
                return {
                    success: false,
                    message: 'Product not found.',
                    data: null
                };
            }
            // Check if link already exists for this user-product
            const existing = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
            if (existing) {
                this.logger.log('Affiliate link already exists.');
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
            this.logger.log('Affiliate link generated successfully.');
            return {
                success: true,
                message: 'Affiliate link generated successfully.',
                data: {
                    ...link,
                    shareableLink
                }
            };
        } catch (error) {
            this.logger.error('Error generating affiliate link:', error);
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
        this.logger.log('Fetching affiliate links for user...');
        try {
            const links = await this.prisma.affiliateLink.findMany({
                where: { userId },
                include: {
                    product: true
                }
            });
            this.logger.log('Affiliate links fetched successfully.');
            return {
                success: true,
                message: 'Affiliate links fetched successfully.',
                data: links
            };
        } catch (error) {
            this.logger.error('Error fetching affiliate links:', error);
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
        this.logger.log('Tracking click for affiliate link...');
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                this.logger.warn('Affiliate link not found.');
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
            this.logger.log('Click tracked.');
            return {
                success: true,
                message: 'Click tracked.',
                data: null
            };
        } catch (error) {
            this.logger.error('Error tracking click:', error);
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
        this.logger.log('Tracking conversion for affiliate link...');
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                this.logger.warn('Affiliate link not found.');
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
            this.logger.log('Conversion tracked.');
            return {
                success: true,
                message: 'Conversion tracked.',
                data: null
            };
        } catch (error) {
            this.logger.error('Error tracking conversion:', error);
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
        this.logger.log('Fetching affiliate link for user and product...');
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
            this.logger.error('Error fetching affiliate link for user and product:', error);
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

        this.logger.log("fetching all commission oayouts for a user")

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

            this.logger.log("commission payouts fetched successfully")

            return {
                success: true,
                message: 'Commission payouts fetched successfully.',
                data: payouts
            };
        } catch (error) {

            this.logger.error("Failed to fetch commission payouts", error)
            return {
                success: false,
                message: 'Failed to fetch commission payouts.',
                data: null,
                error: error?.message || error
            };
        }
    }

    async updateWithdrawalStatus(dto: UpdateWithdrawalStatusDto, req: any) {
        this.logger.log(`Updating payout status for ${dto.withdrawalId} to ${dto.status}`);
        
        // List of allowed payout statuses from WithdrawalStatus enum
        const allowedStatuses = [
            'not_requested',
            'pending',
            'paid',
            'cancelled'
        ];
        
        if (!allowedStatuses.includes(dto.status.toLowerCase())) {
            this.logger.warn(`Invalid payout status. Allowed statuses: ${allowedStatuses.join(', ')}`);
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
                this.logger.warn('Withdrawal request not found.');
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

            this.logger.log(`Payout status updated to ${dto.status} successfully`);
            
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
            this.logger.error('Error updating payout status:', error);
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
        this.logger.log(`Fetching all withdrawal requests... ${JSON.stringify({ page, limit, status })}`);
        
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
                                orderStatus: true
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

            this.logger.log(`Withdrawal requests fetched successfully. Total: ${total}`);

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
            this.logger.error('Error fetching withdrawal requests:', error);
            return {
                success: false,
                message: 'Failed to fetch withdrawal requests.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Fetch paginated summary for affiliates and commissions
     */
    async fetchAffiliatesAndCommissionsSummary(page: number = 1, limit: number = 5) {
        this.logger.log('Fetching affiliates and commissions summary...');
        try {
            // Affiliates
            // Leaderboard (top by total_earned)
            const leaderboardWallets = await this.prisma.wallet.findMany({
                orderBy: { total_earned: 'desc' },
                take: 5,
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
                },
                where: {
                    user: {
                        isAffiliate: true,
                        affiliateStatus: 'approved',
                    }
                }
            });
            const leaderboard = leaderboardWallets.map(w => ({
                id: w.userId,
                name: w.user?.first_name + ' ' + w.user?.last_name,
                email: w.user?.email,
                totalEarned: w.total_earned,
                joinedAt: w.user?.createdAt
            }));

            // All affiliates (paginated)
            const skip = (page - 1) * limit;
            const [affiliates, totalAffiliates] = await Promise.all([
                this.prisma.affiliate.findMany({
                    skip,
                    take: limit,
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
                this.prisma.affiliate.count({})
            ]);
            const formattedAffiliates = affiliates.map(aff => ({
                id: aff.id,
                userId: aff.userId,
                name: aff.userName,
                email: aff.userEmail,
                status: aff.status,
                requestedAt: aff.requestedAt,
                user: aff.user
            }));

            // Pending approval affiliates (paginated)
            const [pendingAffiliates, pendingTotal] = await Promise.all([
                this.prisma.affiliate.findMany({
                    where: { status: 'pending' },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: true
                    }
                }),
                this.prisma.affiliate.count({ where: { status: 'pending' } })
            ]);
            const formattedPendingAffiliates = pendingAffiliates.map(aff => ({
                id: aff.id,
                displayImage: aff.user.display_picture,
                userId: aff.userId,
                name: aff.userName,
                email: aff.userEmail,
                status: aff.status,
                category: aff.category,
                requestedAt: formatDateWithoutTime(aff.requestedAt),
                reason: aff.reason,
                // user: aff.user
            }));

            // Commissions
            // Withdrawal requests (paginated by status)
            const withdrawalStatuses = [
                WithdrawalStatus.pending,
                WithdrawalStatus.paid,
                WithdrawalStatus.cancelled,
                WithdrawalStatus.not_requested
            ];
            const withdrawalRequestsAll = await this.prisma.withdrawalRequest.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: true, bank: true }
            });
            const withdrawalRequestsTotal = await this.prisma.withdrawalRequest.count();
            const withdrawalRequestsByStatus = {};
            for (const status of withdrawalStatuses) {
                withdrawalRequestsByStatus[status] = await this.prisma.withdrawalRequest.findMany({
                    where: { payoutStatus: status },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, bank: true }
                });
            }

            // Helper to format withdrawal requests as per requirements
            const formatWithdrawalRequest = async (request) => {
                // Get user (affiliate)
                const user = request.user;
                // Get wallet for the user
                const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
                // Get bank details
                const bank = request.bank;
                return {
                    id: request.id,
                    payoutId: request.payoutId,
                    affiliateName: user.first_name + ' ' + user.last_name,
                    email: user.email,
                    wallet_summary: {
                        allTimeEarning: wallet?.total_earned ?? 0,
                        availableForWithdrawal: wallet?.available_for_withdrawal ?? 0,
                        totalWithdrawn: wallet?.total_withdrawn ?? 0,
                        pendingApproval: wallet?.awaiting_approval ?? 0
                    },
                    withdrawalAccountDetails: {
                        bankName: bank?.bankName ?? '',
                        accountName: bank?.accountName ?? '',
                        accountNumber: bank?.accountNumber ?? ''
                    },
                    requestedAt: request.requestedAt ? formatDateWithoutTime(request.requestedAt) : ''
                };
            };

            // Format all withdrawal request lists
            const formatWithdrawalRequestsList = async (list) => {
                return await Promise.all(list.map(formatWithdrawalRequest));
            };

            // Format all withdrawal request lists in parallel
            const [
                formattedWithdrawalRequestsAll,
                formattedWithdrawalRequestsPending,
                formattedWithdrawalRequestsCompleted,
                formattedWithdrawalRequestsRejected,
                formattedWithdrawalRequestsCancelled
            ] = await Promise.all([
                formatWithdrawalRequestsList(withdrawalRequestsAll),
                formatWithdrawalRequestsList(withdrawalRequestsByStatus[WithdrawalStatus.pending] || []),
                formatWithdrawalRequestsList(withdrawalRequestsByStatus[WithdrawalStatus.paid] || []),
                formatWithdrawalRequestsList(withdrawalRequestsByStatus[WithdrawalStatus.cancelled] || []),
                formatWithdrawalRequestsList(withdrawalRequestsByStatus[WithdrawalStatus.not_requested] || [])
            ]);

            // Mock fallback object for withdrawal requests
            const mockWithdrawalRequest = {
                id: "mock-id",
                payoutId: "mock-payout-id",
                affiliateName: "John Doe",
                email: "john.doe@example.com",
                wallet_summary: {
                    allTimeEarning: 0,
                    availableForWithdrawal: 0,
                    totalWithdrawn: 0,
                    pendingApproval: 0
                },
                withdrawalAccountDetails: {
                    bankName: "Mock Bank",
                    accountName: "John Doe",
                    accountNumber: "0000000000"
                },
                requestedAt: "2025-01-01"
            };

            // Fallback to mock if empty
            const fallbackIfEmpty = (arr) => (arr.length > 0 ? arr : [mockWithdrawalRequest]);

            // Get total counts for each withdrawal status
            const [
                pendingTotalCount,
                completedTotalCount,
                cancelledTotalCount,
                notRequestedTotalCount
            ] = await Promise.all([
                this.prisma.withdrawalRequest.count({ where: { payoutStatus: WithdrawalStatus.pending } }),
                this.prisma.withdrawalRequest.count({ where: { payoutStatus: WithdrawalStatus.paid } }),
                this.prisma.withdrawalRequest.count({ where: { payoutStatus: WithdrawalStatus.cancelled } }),
                this.prisma.withdrawalRequest.count({ where: { payoutStatus: WithdrawalStatus.not_requested } })
            ]);

            // Format all commission lists in parallel (using CommissionReferral)
            const commissionReferralStatuses = [
                CommissionReferralStatus.approved,
                CommissionReferralStatus.awaiting_approval,
                CommissionReferralStatus.rejected,
                CommissionReferralStatus.pending
            ];
            // Fetch all CommissionReferral lists and counts
            const [
                commissionReferralsAll,
                commissionReferralsTotal,
                commissionReferralsApproved,
                commissionReferralsApprovedTotal,
                commissionReferralsAwaitingApproval,
                commissionReferralsAwaitingApprovalTotal,
                commissionReferralsRejected,
                commissionReferralsRejectedTotal,
                commissionReferralsPending,
                commissionReferralsPendingTotal
            ] = await Promise.all([
                this.prisma.commissionReferral.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, order: true }
                }),
                this.prisma.commissionReferral.count(),
                this.prisma.commissionReferral.findMany({
                    where: { status: CommissionReferralStatus.approved },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, order: true }
                }),
                this.prisma.commissionReferral.count({ where: { status: CommissionReferralStatus.approved } }),
                this.prisma.commissionReferral.findMany({
                    where: { status: CommissionReferralStatus.awaiting_approval },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, order: true }
                }),
                this.prisma.commissionReferral.count({ where: { status: CommissionReferralStatus.awaiting_approval } }),
                this.prisma.commissionReferral.findMany({
                    where: { status: CommissionReferralStatus.rejected },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, order: true }
                }),
                this.prisma.commissionReferral.count({ where: { status: CommissionReferralStatus.rejected } }),
                this.prisma.commissionReferral.findMany({
                    where: { status: CommissionReferralStatus.pending },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, order: true }
                }),
                this.prisma.commissionReferral.count({ where: { status: CommissionReferralStatus.pending } })
            ]);

            // Formatter for CommissionReferral
            const formatCommissionReferral = async (cr) => {
                const user = cr.user;
                return {
                    id: cr.id,
                    orderId: cr.orderId || '',
                    payoutId: cr.orderId || '',
                    referralCode: cr.type || '',
                    refereeName: user ? (user.first_name + ' ' + user.last_name) : '',
                    refereeEmail: user ? user.email : '',
                    totalPurchase: cr.totalPurchaseAmount || 1,
                    earnedCommission: cr.amount || 1,
                    initiatedAt: cr.createdAt ? formatDateWithoutTime(cr.createdAt) : '',
                    status: cr.status || 'pending'
                };
            };
            const formatCommissionReferralsList = async (list) => {
                return await Promise.all(list.map(formatCommissionReferral));
            };
            const [
                formattedCommissionReferralsAll,
                formattedCommissionReferralsApproved,
                formattedCommissionReferralsAwaitingApproval,
                formattedCommissionReferralsRejected,
                formattedCommissionReferralsPending
            ] = await Promise.all([
                formatCommissionReferralsList(commissionReferralsAll),
                formatCommissionReferralsList(commissionReferralsApproved),
                formatCommissionReferralsList(commissionReferralsAwaitingApproval),
                formatCommissionReferralsList(commissionReferralsRejected),
                formatCommissionReferralsList(commissionReferralsPending)
            ]);
            // Mock fallback object for commission referrals
            const mockCommissionReferral = {
                payoutId: "mock-payout-id",
                referralCode: "mock-referral-code",
                refereeName: "Jane Smith",
                refereeEmail: "jane.smith@example.com",
                totalPurchase: 0,
                earnedCommission: 0,
                initiatedAt: "2025-01-01",
                status: "pending"
            };
            const fallbackCommissionReferralsIfEmpty = (arr) => (arr.length > 0 ? arr : [mockCommissionReferral]);

            // Calculate KPI Cards (reuse logic from fetchAffiliateDashboard)
            const [
                totalRevenueAgg,
                totalAffiliatesKPI,
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
                totalAffiliates: totalAffiliatesKPI,
                totalClicks: totalClicks,
                totalConversions: totalConversions,
                pendingPayouts: Number(pendingPayoutsAgg._sum?.amount || 0)
            };

            // Final formatted response
            let formattedResponse = {
                kpiCards,
                affiliates: {
                    leaderboard,
                    all_affiliates: {
                        page,
                        limit,
                        total: totalAffiliatesKPI,
                        data: formattedAffiliates,
                    },
                    pending_approval_affiliates: {
                        page,
                        limit,
                        total: pendingTotal,
                        data: formattedPendingAffiliates,
                    }
                },
                commissions: {
                    withdrawal_requests: {
                        all_withdrawal_requests: { page, limit, total: withdrawalRequestsTotal, data: fallbackIfEmpty(formattedWithdrawalRequestsAll) },
                        pending_withdrawal_requests: { page, limit, total: pendingTotalCount, data: fallbackIfEmpty(formattedWithdrawalRequestsPending) },
                        completed_withdrawal_requests: { page, limit, total: completedTotalCount, data: fallbackIfEmpty(formattedWithdrawalRequestsCompleted) },
                        rejected_withdrawal_requests: { page, limit, total: notRequestedTotalCount, data: fallbackIfEmpty(formattedWithdrawalRequestsRejected) },
                        cancelled_withdrawal_requests: { page, limit, total: cancelledTotalCount, data: fallbackIfEmpty(formattedWithdrawalRequestsCancelled) }
                    },
                    commissions: {
                        all_commissions: { page, limit, total: commissionReferralsTotal, data: fallbackCommissionReferralsIfEmpty(formattedCommissionReferralsAll) },
                        approved_commissions: { page, limit, total: commissionReferralsApprovedTotal, data: fallbackCommissionReferralsIfEmpty(formattedCommissionReferralsApproved) },
                        awaiting_approval_commissions: { page, limit, total: commissionReferralsAwaitingApprovalTotal, data: fallbackCommissionReferralsIfEmpty(formattedCommissionReferralsAwaitingApproval) },
                        rejected_commissions: { page, limit, total: commissionReferralsRejectedTotal, data: fallbackCommissionReferralsIfEmpty(formattedCommissionReferralsRejected) },
                        pending_commissions: { page, limit, total: commissionReferralsPendingTotal, data: fallbackCommissionReferralsIfEmpty(formattedCommissionReferralsPending) }
                    }
                }
            };
            this.logger.log('Affiliates and commissions summary returned');
            return {
                success: true,
                message: 'Affiliates and commissions summary fetched successfully.',
                data: formattedResponse
            };
        } catch (error) {
            this.logger.error('Error fetching affiliates and commissions summary:', error);
            return {
                success: false,
                message: 'Failed to fetch affiliates and commissions summary.',
                data: null
            };
        }
    }

    // Change commission referral status (approve/reject)
    async changeCommissionReferralStatus(dto: ChangeCommissionReferralStatusDto, adminUser: any) {
        const allowedStatuses = [CommissionReferralStatus.approved, CommissionReferralStatus.rejected];
        // if (!allowedStatuses.includes(dto.status)) {
        //     throw new BadRequestException(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
        // }

        if (dto.status === CommissionReferralStatus.approved) {
            // Fetch the commission referral and wallet
            const commissionReferral = await this.prisma.commissionReferral.findUnique({
                where: { id: dto.commissionReferralId },
                include: { user: true }
            });
            if (!commissionReferral) throw new NotFoundException('CommissionReferral not found');

            // Only allow status change if currently awaiting_approval
            if (commissionReferral.status !== CommissionReferralStatus.awaiting_approval) {
                throw new BadRequestException('Only referrals with status awaiting_approval can be changed');
            }
        } else if (dto.status === CommissionReferralStatus.rejected) {
            // Fetch the commission referral and wallet
            const commissionReferral = await this.prisma.commissionReferral.findUnique({
                where: { id: dto.commissionReferralId },
                include: { user: true }
            });
            if (!commissionReferral) throw new NotFoundException('CommissionReferral not found');

            // Only allow status change if currently awaiting_approval
            if (commissionReferral.status !== CommissionReferralStatus.awaiting_approval) {
                throw new BadRequestException('Only referrals with status awaiting_approval can be changed');
            }
        }

        // Fetch the commission referral and wallet
        const commissionReferral = await this.prisma.commissionReferral.findUnique({
            where: { id: dto.commissionReferralId },
            include: { user: true }
        });
        if (!commissionReferral) throw new NotFoundException('CommissionReferral not found');

        let wallet = await this.prisma.wallet.findUnique({ where: { userId: commissionReferral.userId } });
        if (!wallet) {
            this.logger.log(colors.green('Creating wallet for user: ' + commissionReferral.user.email));
            wallet = await this.prisma.wallet.create({
                data: {
                    userId: commissionReferral.userId,
                    total_earned: 0,
                    awaiting_approval: 0,
                    available_for_withdrawal: 0,
                    total_withdrawn: 0,
                    balance_before: 0,
                    balance_after: 0,
                }
            });
        }

        // Only allow status change if currently awaiting_approval
        if (commissionReferral.status !== 'awaiting_approval') {
            throw new BadRequestException('Only referrals with status awaiting_approval can be changed');
        }

        // Fetch wallet before update for analysis
        const walletBefore = { ...wallet };

        // Transaction: update referral and wallet
        let updatedCommissionReferral, updatedWallet;
        await this.prisma.$transaction(async (tx) => {
            // Update CommissionReferral status
            updatedCommissionReferral = await tx.commissionReferral.update({
                where: { id: dto.commissionReferralId },
                data: {
                    status: dto.status,
                    updatedAt: new Date(),
                    // processedBy: adminUser?.id
                }
            });

            // Calculate new wallet balances
            const amount = commissionReferral.amount || 0;
            let walletUpdate: any = {};
            if (dto.status === CommissionReferralStatus.approved) {
                walletUpdate = {
                    awaiting_approval: { decrement: amount },
                    available_for_withdrawal: { increment: amount }
                };
            } else if (dto.status === CommissionReferralStatus.rejected) {
                walletUpdate = {
                    awaiting_approval: { decrement: amount }
                };
            }

            updatedWallet = await tx.wallet.update({
                where: { userId: commissionReferral.userId },
                data: walletUpdate
            });
        });

        // After transaction, if approved, send email to affiliate
        if (dto.status === CommissionReferralStatus.approved) {
            try {
                // Fetch order and buyer details for the email
                let order: any = null;
                let buyerName = '';
                let buyerEmail = '';
                let productName = '';
                let productImageUrl = '';
                if (updatedCommissionReferral.orderId) {
                    order = await this.prisma.order.findUnique({
                        where: { id: updatedCommissionReferral.orderId },
                        include: { user: true, items: { include: { product: true } } }
                    });
                    if (order) {
                        buyerName = order.user ? `${order.user.first_name} ${order.user.last_name}` : '';
                        buyerEmail = order.user ? order.user.email : '';
                        productName = order.items && order.items.length > 0 && order.items[0].product ? order.items[0].product.name : '';
                        // Try to get product image from first order item
                        if (order.items && order.items.length > 0 && order.items[0].product && order.items[0].product.displayImages) {
                            const images = Array.isArray(order.items[0].product.displayImages)
                                ? order.items[0].product.displayImages
                                : (typeof order.items[0].product.displayImages === 'string' ? JSON.parse(order.items[0].product.displayImages) : []);
                            if (images && images.length > 0) {
                                productImageUrl = typeof images[0] === 'string' ? images[0] : images[0].url || images[0].secureUrl || '';
                            }
                        }
                    }
                }
                await sendCommissionApprovedMail({
                    affiliateName: commissionReferral.user?.first_name + ' ' + commissionReferral.user?.last_name,
                    affiliateEmail: commissionReferral.user?.email,
                    orderId: order?.orderId || updatedCommissionReferral.orderId || '',
                    buyerName,
                    buyerEmail,
                    productName,
                    commissionAmount: updatedCommissionReferral.amount || 0,
                    walletBefore: {
                        available: walletBefore.available_for_withdrawal ?? 0,
                        pending: walletBefore.awaiting_approval ?? 0,
                        total: walletBefore.total_earned ?? 0
                    },
                    walletAfter: {
                        available: updatedWallet.available_for_withdrawal ?? 0,
                        pending: updatedWallet.awaiting_approval ?? 0,
                        total: updatedWallet.total_earned ?? 0
                    },
                    approvedAt: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
                    productImageUrl
                }, commissionReferral.user?.email);
            } catch (err) {
                this.logger.error('Failed to send commission approval email:', err);
            }
        }

        // Format commissionReferral for response
        const formattedCommission = {
            id: updatedCommissionReferral.id,
            orderId: updatedCommissionReferral.orderId || '',
            payoutId: updatedCommissionReferral.orderId || '',
            channel: updatedCommissionReferral.type || '',
            totalPurchase: updatedCommissionReferral.totalPurchaseAmount || 0,
            earnedCommission: updatedCommissionReferral.amount || 0,
            status: updatedCommissionReferral.status
        };
        // Format wallet analysis
        const walletAnalysisBefore = {
            total_earned: walletBefore.total_earned,
            awaiting_approval: walletBefore.awaiting_approval,
            available_for_withdrawal: walletBefore.available_for_withdrawal,
            total_withdrawn: walletBefore.total_withdrawn,
            balance_before: walletBefore.balance_before,
            balance_after: walletBefore.balance_after
        };
        const walletAnalysisAfter = {
            total_earned: updatedWallet.total_earned,
            awaiting_approval: updatedWallet.awaiting_approval,
            available_for_withdrawal: updatedWallet.available_for_withdrawal,
            total_withdrawn: updatedWallet.total_withdrawn,
            balance_before: updatedWallet.balance_before,
            balance_after: updatedWallet.balance_after
        };
        const formattedResponse = {
            commission: formattedCommission,
            updatedWallet: {
                wallet_analysis_before: walletAnalysisBefore,
                wallet_analysis_after: walletAnalysisAfter
            }
        };
        this.logger.log(colors.yellow('CommissionReferral status updated'));
        return new ApiResponse(true, 'CommissionReferral status updated successfully', formattedResponse);
    }
}