import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { sendCommissionApprovalReportMail } from 'src/common/mailer/send-mail';
import * as colors from 'colors';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(private prisma: PrismaService) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleCommissionApproval() {
        this.logger.log(colors.cyan('🔄 Starting commission approval cron job...'));
        
        try {
            // Find all commission referrals with 'awaiting_approval' status
            const pendingCommissions = await this.prisma.commissionReferral.findMany({
                where: {
                    status: 'awaiting_approval'
                },
                include: {
                    order: {
                        include: {
                            user: true
                        }
                    },
                    user: {
                        include: {
                            wallet: true
                        }
                    },
                    product: true,
                    referrer: true,
                    referred: true
                }
            });

            this.logger.log(colors.yellow(`📊 Found ${pendingCommissions.length} pending commissions`));

            let approvedCount = 0;
            let skippedCount = 0;
            let totalAmountApproved = 0;
            
            const approvedCommissions: any[] = [];
            const skippedCommissions: any[] = [];

            for (const commission of pendingCommissions) {
                try {
                    // Check if order exists and has 'delivered' status
                    if (!commission.order || commission.order.shipmentStatus !== 'delivered') {
                        const reason = 'Order not delivered';
                        this.logger.log(colors.yellow(`⏭️ Skipping commission ${commission.id}: ${reason}`));
                        
                        skippedCommissions.push({
                            commissionId: commission.id,
                            orderId: commission.orderId || 'N/A',
                            reason,
                            commissionOwnerId: commission.userId,
                            commissionOwnerName: `${commission.user.first_name} ${commission.user.last_name}`,
                            orderTotal: commission.totalPurchaseAmount || 0,
                            commissionAmount: commission.amount || 0,
                            orderCreatedDate: commission.order?.createdAt || new Date().toISOString(),
                            orderStatus: commission.order?.shipmentStatus || 'Unknown'
                        });
                        
                        skippedCount++;
                        continue;
                    }

                    // Check if order was created 30 days ago
                    const orderCreatedDate = new Date(commission.order.createdAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    if (orderCreatedDate > thirtyDaysAgo) {
                        const reason = 'Order not 30 days old';
                        this.logger.log(colors.yellow(`⏭️ Skipping commission ${commission.id}: ${reason} (created: ${orderCreatedDate.toISOString()})`));
                        
                        skippedCommissions.push({
                            commissionId: commission.id,
                            orderId: commission.orderId || 'N/A',
                            reason,
                            commissionOwnerId: commission.userId,
                            commissionOwnerName: `${commission.user.first_name} ${commission.user.last_name}`,
                            orderTotal: commission.totalPurchaseAmount || 0,
                            commissionAmount: commission.amount || 0,
                            orderCreatedDate: commission.order.createdAt.toISOString(),
                            orderStatus: commission.order.shipmentStatus
                        });
                        
                        skippedCount++;
                        continue;
                    }

                    // Check if commission amount exists
                    if (!commission.amount || commission.amount <= 0) {
                        const reason = 'No valid commission amount';
                        this.logger.log(colors.yellow(`⏭️ Skipping commission ${commission.id}: ${reason}`));
                        
                        skippedCommissions.push({
                            commissionId: commission.id,
                            orderId: commission.orderId || 'N/A',
                            reason,
                            commissionOwnerId: commission.userId,
                            commissionOwnerName: `${commission.user.first_name} ${commission.user.last_name}`,
                            orderTotal: commission.totalPurchaseAmount || 0,
                            commissionAmount: commission.amount || 0,
                            orderCreatedDate: commission.order.createdAt.toISOString(),
                            orderStatus: commission.order.shipmentStatus
                        });
                        
                        skippedCount++;
                        continue;
                    }

                    // Check if user has a wallet
                    if (!commission.user.wallet) {
                        const reason = 'User has no wallet';
                        this.logger.log(colors.yellow(`⏭️ Skipping commission ${commission.id}: ${reason}`));
                        
                        skippedCommissions.push({
                            commissionId: commission.id,
                            orderId: commission.orderId || 'N/A',
                            reason,
                            commissionOwnerId: commission.userId,
                            commissionOwnerName: `${commission.user.first_name} ${commission.user.last_name}`,
                            orderTotal: commission.totalPurchaseAmount || 0,
                            commissionAmount: commission.amount || 0,
                            orderCreatedDate: commission.order.createdAt.toISOString(),
                            orderStatus: commission.order.shipmentStatus
                        });
                        
                        skippedCount++;
                        continue;
                    }

                    // Update wallet: move from commission_awaiting_approval to available_for_withdrawal
                    const updatedWallet = await this.prisma.wallet.update({
                        where: { userId: commission.userId },
                        data: {
                            commission_awaiting_approval: {
                                decrement: commission.amount
                            },
                            available_for_withdrawal: {
                                increment: commission.amount
                            }
                        }
                    });

                    // Update commission status to 'approved'
                    await this.prisma.commissionReferral.update({
                        where: { id: commission.id },
                        data: {
                            status: 'approved'
                        }
                    });

                    // Calculate days since delivery
                    const orderDeliveredDate = new Date(commission.order.updatedAt);
                    const daysSinceDelivery = Math.floor((new Date().getTime() - orderDeliveredDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Collect approved commission data
                    approvedCommissions.push({
                        commissionId: commission.id,
                        orderId: commission.orderId || 'N/A',
                        commissionOwnerId: commission.userId,
                        commissionOwnerName: `${commission.user.first_name} ${commission.user.last_name}`,
                        commissionOwnerEmail: commission.user.email,
                        purchaserId: commission.order.userId,
                        purchaserName: `${commission.order.user.first_name} ${commission.order.user.last_name}`,
                        purchaserEmail: commission.order.user.email,
                        referrerId: commission.referrerId,
                        referrerName: commission.referrer ? `${commission.referrer.first_name} ${commission.referrer.last_name}` : undefined,
                        referrerEmail: commission.referrer?.email,
                        productId: commission.productId || 'N/A',
                        productName: commission.product?.name || 'Unknown Product',
                        orderTotal: commission.totalPurchaseAmount || 0,
                        commissionAmount: commission.amount || 0,
                        commissionPercentage: commission.commissionPercentage || '0%',
                        orderCreatedDate: commission.order.createdAt.toISOString(),
                        orderDeliveredDate: commission.order.updatedAt.toISOString(),
                        daysSinceDelivery
                    });

                    this.logger.log(colors.green(`✅ Approved commission ${commission.id}: ${commission.amount} moved to available_for_withdrawal`));
                    this.logger.log(colors.cyan(`💰 User ${commission.userId} wallet updated: commission_awaiting_approval=${updatedWallet.commission_awaiting_approval}, available_for_withdrawal=${updatedWallet.available_for_withdrawal}`));
                    
                    approvedCount++;
                    totalAmountApproved += commission.amount || 0;

                } catch (error) {
                    this.logger.error(colors.red(`❌ Error processing commission ${commission.id}:`), error);
                }
            }

            this.logger.log(colors.green(`🎉 Commission approval cron job completed:`));
            this.logger.log(colors.green(`  - Approved: ${approvedCount}`));
            this.logger.log(colors.yellow(`  - Skipped: ${skippedCount}`));
            this.logger.log(colors.green(`  - Total processed: ${pendingCommissions.length}`));

            // Send email report to admins
            try {
                // Get all admin users
                const adminUsers = await this.prisma.user.findMany({
                    where: {
                        role: {
                            in: ['admin', 'super_admin']
                        }
                    },
                    select: {
                        email: true
                    }
                });

                if (adminUsers.length > 0) {
                    const adminEmails = adminUsers.map(user => user.email);
                    const reportDate = new Date().toLocaleDateString('en-NG');
                    
                    const reportData = {
                        reportDate,
                        totalCommissionsProcessed: pendingCommissions.length,
                        totalCommissionsApproved: approvedCount,
                        totalCommissionsSkipped: skippedCount,
                        totalAmountApproved,
                        approvedCommissions,
                        skippedCommissions
                    };

                    await sendCommissionApprovalReportMail(reportData, adminEmails);
                    this.logger.log(colors.cyan(`📧 Commission approval report sent to ${adminEmails.length} admin(s)`));
                } else {
                    this.logger.log(colors.yellow(`⚠️ No admin users found to send report to`));
                }
            } catch (emailError) {
                this.logger.error(colors.red('❌ Error sending commission approval report:'), emailError);
            }

        } catch (error) {
            this.logger.error(colors.red('❌ Error in commission approval cron job:'), error);
        }
    }

    // Manual trigger for testing
    async triggerCommissionApproval() {
        this.logger.log(colors.cyan('🔄 Manually triggering commission approval...'));
        await this.handleCommissionApproval();
    }
} 