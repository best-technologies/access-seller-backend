import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';
import { RequestCommissionPayoutDto, } from './dto/commission-payout.dto';
import { AffiliateStatus } from '@prisma/client';
import { formatAmount, formatDate, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import { AddBankDto, DeleteBankDto, UpdateBankStatusDto } from './dto/bank.dto';
import { RequestWithdrawalNewDto } from './dto/withdrawal-request.dto';
// import { PayoutMethod } from './dto/withdrawal-request.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getUserAllowedPartialpayment(payload) {

    this.logger.log(colors.cyan("Fetching user details for payment"))

    try {
        
        const existingUser = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true, allowedPartialPayment: true }
        });

        const formattedUser = {
            id: existingUser?.id,
            allowedPartialPayment: existingUser?.allowedPartialPayment
        }

        this.logger.log(colors.magenta("Users partial payment details retrieved"))
        return new ApiResponse(
            true,
            "User partial opayment details successfully fetched",
            formattedUser
        )

    } catch (error) {
        this.logger.error(colors.red("Error fetching details: "), error)
        return new ApiResponse(
            false,
            "Error fetching partial payment details "
        )
    }
  }

  async requestToBecomeAnAffiliate(dto: requestAffiliatePermissionDto, payload: any) {

    this.logger.log(colors.cyan("requesting to become an affiliate"), dto)

    try {
      // Fetch user
      const user = await this.prisma.user.findFirst({ where: { email: payload.email } });
      if (!user) {
        return new ApiResponse(false, 'User not found.');
      }
      if (user.isAffiliate) {
        this.logger.log(colors.red("User is already an affiliate"))
        return new ApiResponse(false, 'You are already an affiliate.');
      }
      if (user.affiliateStatus === 'pending') {
        this.logger.log(colors.red("You already have a pending affiliate request."))
        return new ApiResponse(false, 'You already have a pending affiliate request.');
      }
      // Check if there is already a pending Affiliate
      const existingRequest = await this.prisma.affiliate.findFirst({
        where: { userId: user.id, status: 'pending' }
      });
      if (existingRequest) {
        this.logger.log(colors.red("You already have a pending affiliate request."))
        return new ApiResponse(false, 'You already have a pending affiliate request.');
      }
      // Create Affiliate record (request)
      const newAffiliate = await this.prisma.affiliate.create({
        data: {
          userId: user.id,
          userName: user.first_name + ' ' + user.last_name,
          userEmail: user.email,
          status: 'pending',
          requestedAt: new Date(),
          category: dto.niche,
          reason: dto.reason || "",
          reviewedAt: null,
          reviewedByName: null,
          reviewedByEmail: null,
          notes: null
        }
      });

      //   also update the is affiliate and affiliate status in the user model to true and awaiting approval respectively 
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isAffiliate: false,
          affiliateStatus: 'awaiting_approval',
        },
      });

      const formattedResponse = {
        id: user.id,
        userName: user.first_name + ' ' + user.last_name,
        userEmail: user.email,
        status: newAffiliate.status,
        requestedAt: new Date(),
        category: newAffiliate.category,
        reason: newAffiliate.reason || "",
      };

      this.logger.log(colors.magenta("Successfully requested for affiliate permission"))
      return new ApiResponse(
        true,
        'Affiliate request submitted and is awaiting approval.',
        formattedResponse
      );
    } catch (error) {
      this.logger.error('Error requesting affiliate status', error);
      return new ApiResponse(
        false,
        'Failed to submit affiliate request.'
      );
    }
  }

  async fetchAffiliateDashboard(payload: any) {
    this.logger.log(colors.cyan("Fetching affiliate dashboard"));
    try {
      // 1. Fetch user
      const user = await this.prisma.user.findFirst({ where: { email: payload.email } });
      if (!user) {
        return new ApiResponse(false, 'User not found.');
      }

      const bankDetails = await this.prisma.bank.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          bankCode: true,
        },
      });

      // 2. Fetch affiliate record and referral details
      const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: user.id } });
      const referral = await this.prisma.referral.findFirst({ where: { referredId: user.id } });
      const referralCodeRecord = await this.prisma.referralCode.findUnique({ where: { userId: user.id } });

      // 2. Fetch wallet for stats
      const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });

      // 3. Fetch stats and recent commission/referral records
      const [totalPurchases, recentRecords] = await Promise.all([
        this.prisma.commissionReferral.count({
          where: {
            userId: user.id,
            type: 'purchase',
          }
        }),
        this.prisma.commissionReferral.findMany({
          where: {
            userId: user.id
          },
          include: {
            order: {
              include: {
                user: { select: { first_name: true, last_name: true, email: true } },
                items: {
                  select: {
                    product: { select: { displayImages: true } }
                  }
                }
              }
            },
            product: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      // 4. Format table analysis (using CommissionReferral)
      const tableAnalysis = recentRecords.map(record => {
        const order = record.order;
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 2);
        const approved = order && order.createdAt < fourDaysAgo;
        return {
          id: record.id,
          orderId: order?.orderId,
          buyerName: order ? order.user?.first_name + ' ' + order.user?.last_name : '',
          buyerEmail: order ? order.user?.email : '',
          orderAmount: order ? formatAmount(order.total_amount) : '',
          // withdrawalStatus: order ? order.withdrawalStatus : '',
          displayImage: order?.items?.[0]?.product?.displayImages?.[0]?.secure_url,
          commissionEarned: formatAmount(record.amount || 0),
          orderDate: order ? formatDateWithoutTime(order.createdAt) : '',
          status: record.status,
          approved,
          channel: record.type,
        };
      });

      // 5. Fetch payouts (withdrawal requests)
      const withdrawals = await this.prisma.withdrawalRequest.findMany({
        where: { userId: user.id },
        orderBy: { requestedAt: 'desc' }
      });
      const payouts = withdrawals.map(w => ({
        id: w.id,
        payoutId: w.payoutId || '',
        amount: w.commissionAmount,
        date: w.requestedAt,
        status: w.payoutStatus === 'pending' ? 'pending' :
               w.payoutStatus === 'paid' ? 'completed' :
               w.payoutStatus === 'cancelled' ? 'rejected' :
               w.payoutStatus // fallback
      }));

      // 6. Build response (stats from wallet)
      const dashboard = {
        referralCode: referralCodeRecord?.code || "",
        is_affiliate: user.isAffiliate,
        affiliate_status: user.affiliateStatus,
        stats: {
          totalPurchases,
          totalEarned: wallet?.total_earned || 0,
          totalWithdrawn: wallet?.total_withdrawn || 0,
          pendingApproval: wallet?.awaiting_approval || 0,
          available_for_withdrawal: wallet?.available_for_withdrawal || 0
        },
        joined: affiliate?.createdAt ? formatDate(affiliate.createdAt) : null,
        banks: bankDetails || [],
        affiliate, 
        referral,
        tableAnalysis,
        payouts
      };

      this.logger.log('[users service] Affiliate dashboard fetched successfully.')

      return new ApiResponse(true, 'Affiliate dashboard fetched successfully.', dashboard);
    } catch (error) {
      this.logger.error('Error fetching affiliate dashboard', error);
      return new ApiResponse(false, 'Failed to fetch affiliate dashboard.');
    }
  }

  async generateAffiliateLink(userId: string, productId: string) {
    this.logger.log(colors.cyan("generating affiliate link"));
    try {
        // Check if user is an approved/active affiliate
        const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
        if (!affiliate || !(affiliate.status === AffiliateStatus.approved || affiliate.status === AffiliateStatus.active)) {
            this.logger.log(colors.red('User is not an approved or active affiliate.'));
            return {
                success: false,
                message: 'User is not an approved or active affiliate.',
                data: null
            };
        } 
        // Check if product exists
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            this.logger.log(colors.red('Product not found.'));
            return {
                success: false,
                message: 'Product not found.',
                data: null
            };
        }
        // Check if link already exists for this user-product
        const existing = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
        if (existing) {
            this.logger.log(colors.yellow('Affiliate link already exists.'));
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

        let base_url: string;
        if(process.env.NODE_ENV === "development") {
          base_url = process.env.FRONTEND_BASE_URL_STAGING || ""
        } else {
          base_url = process.env.FRONTEND_BASE_URL_PROD || ""
        }

        // Construct shareable link
        const productSlug = product.id;
        const shareableLink = `${base_url.replace(/\/$/, '')}/products/${productSlug}?ref=${link.slug}`;
        this.logger.log(colors.green('Affiliate link generated successfully.'));
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

  async getAffiliateLinksForUser(user: any) {
    this.logger.log(colors.cyan('[user-service] Fetching affiliate links for user...'));
    try {
        // Get user from email
        const existingUser = await this.prisma.user.findFirst({ 
            where: { email: user.email } 
        });
        
        if (!existingUser) {
            return {
                success: false,
                message: 'User not found.',
                data: null
            };
        }

        const links = await this.prisma.affiliateLink.findMany({
            where: { userId: existingUser.id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        displayImages: true,
                        commission: true,
                        status: true,
                        sellingPrice: true
                    } 
                }
            }
        });
      
        this.logger.log(colors.green(`Total of ${links.length} Affiliate links fetched successfully.`));
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
   * User requests a commission payout
   */
  async requestCommissionPayout(user: any, dto: RequestCommissionPayoutDto) {
    // Validate user
    const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
    if (!existingUser) {
      return new ApiResponse(false, 'User not found.');
    }
    // Calculate total pending commission
    const pendingAgg = await this.prisma.commission.aggregate({
      _sum: { amount: true },
      where: { userId: existingUser.id, status: 'pending' }
    });
    const pendingAmount = Number(pendingAgg._sum.amount || 0);
    if (dto.amount > pendingAmount) {
      return new ApiResponse(false, 'Requested amount exceeds pending commission.');
    }
    // Generate unique reference
    const reference = `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    // Create payout request
    const payout = await this.prisma.commissionPayout.create({
      data: {
        userId: existingUser.id,
        amount: dto.amount,
        method: dto.method,
        reference,
        status: 'pending',
      }
    });
    return new ApiResponse(true, 'Commission payout requested.', payout);
  }

  /**
   * Get user's commission payout history
   */
  async getCommissionPayoutHistory(user: any) {
    const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
    if (!existingUser) {
      return new ApiResponse(false, 'User not found.');
    }
    const payouts = await this.prisma.commissionPayout.findMany({
      where: { userId: existingUser.id },
      orderBy: { requestedAt: 'desc' }
    });
    return new ApiResponse(true, 'Commission payout history fetched.', payouts);
  }

  async addBank(user: any, dto: AddBankDto) {
    try {
      this.logger.log(colors.cyan('[user-service] Adding new bank for user...'));
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        this.logger.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }
      // Check for duplicate bank (by accountNumber and bankCode for this user)
      const existingBank = await this.prisma.bank.findFirst({
        where: {
          userId: existingUser.id,
          accountNumber: dto.accountNumber,
          bankCode: dto.bankCode,
        },
      });
      if (existingBank) {
        this.logger.log(colors.red('[user-service] Bank with this account number and bank code already exists for user.'));
        return new ApiResponse(false, 'Bank with this account number and bank code already exists.');
      }
      const bank = await this.prisma.bank.create({
        data: {
          userId: existingUser.id,
          bankName: dto.bankName,
          bankCode: dto.bankCode,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
        },
      });
      this.logger.log(colors.green('[user-service] Bank added successfully.'));
      return new ApiResponse(true, 'Bank added successfully.', bank);
    } catch (error) {
      this.logger.error('[user-service] Error adding bank:', error);
      return new ApiResponse(false, 'Failed to add bank.');
    }
  }

  async deleteBank(user: any, dto: DeleteBankDto) {
    try {
      this.logger.log(colors.cyan('[user-service] Deleting bank for user...'), user.id);
      this.logger.log(colors.cyan('[user-service] Bank id...'), dto.bankId);
      this.logger.log(colors.cyan('[user-service] Deleting bank for user...'), dto.bankId);
      
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        this.logger.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }
      // Ensure the bank belongs to the user
      const bank = await this.prisma.bank.findFirst({ where: { id: dto.bankId } });
      if (!bank) {
        this.logger.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }

      await this.prisma.bank.delete({ where: { id: dto.bankId } });

      this.logger.log(colors.green('[user-service] Bank deleted successfully.'));
      return new ApiResponse(true, 'Bank deleted successfully.');

    } catch (error) {
      this.logger.error('[user-service] Error deleting bank:', error);
      return new ApiResponse(false, 'Failed to delete bank.');
    }
  }

  async updateBankStatus(user: any, dto: UpdateBankStatusDto) {
    try {
      this.logger.log(colors.cyan('[user-service] Updating bank status for user...'));
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        this.logger.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }
      // Ensure the bank belongs to the user
      const bank = await this.prisma.bank.findFirst({ where: { id: dto.bankId, userId: existingUser.id } });
      if (!bank) {
        this.logger.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }
      // The Bank model does not have an isActive field
      this.logger.log(colors.red('[user-service] Bank status cannot be updated because the Bank model does not have an isActive field.'));
      return new ApiResponse(false, 'Bank status cannot be updated because the Bank model does not have an isActive field.');
    } catch (error) {
      this.logger.error('[user-service] Error updating bank status:', error);
      return new ApiResponse(false, 'Failed to update bank status.');
    }
  }

  // //////////////////////////////////////////////////////////////////////// Request withdrawal
  async requestWithdrawal(user: any, dto: RequestWithdrawalNewDto) {
    try {
      this.logger.log(colors.cyan('[user-service] Creating new withdrawal request...'), dto);
      
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        this.logger.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }

      const bank = await this.prisma.bank.findFirst({
        where: { bankCode: dto.bankCode, userId: existingUser.id }
      });

      if (!bank) {
        this.logger.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }

      // Generate unique payoutId
      function generatePayoutId() {
        return `out/acc${Math.random().toString(36).substring(2, 8)}`;
      }

      // Generate unique reference
      const reference = `acc-withdraw-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const payoutId = generatePayoutId();

      // Create withdrawal request and update order status in a transaction
      const withdrawalRequest = await this.prisma.withdrawalRequest.create({
        data: {
          userId: existingUser.id,
          withdrawal_amount: Number(dto.amount),
          commissionAmount: Number(dto.amount),
          payoutMethod: "bank transfer",
          bankId: bank.id,
          reference,
          // Add other fields as needed from dto
        }
      });

      this.logger.log(colors.green('[user-service] Withdrawal request created successfully.'));
      return new ApiResponse(true, 'Withdrawal request created successfully.', withdrawalRequest);

    } catch (error) {
      this.logger.error('[user-service] Error creating withdrawal request:', error);
      return new ApiResponse(false, 'Failed to create withdrawal request.');
    }
  }

  async getWithdrawalRequests(user: any) {
    const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
    if (!existingUser) {
      return new ApiResponse(false, 'User not found.');
    }
    const withdrawals = await this.prisma.withdrawalRequest.findMany({
      where: { userId: existingUser.id },
      orderBy: { requestedAt: 'desc' }
    });

    // Format the response as requested
    const formatted = withdrawals.map(w => ({
      id: w.id,
      payoutId: w.payoutId || "",
      amount: w.commissionAmount,
      date: w.requestedAt,
      status: w.payoutStatus === 'pending' ? 'pending' :
             w.payoutStatus === 'paid' ? 'completed' :
             w.payoutStatus === 'cancelled' ? 'rejected' :
             w.payoutStatus // fallback
    }));
    return new ApiResponse(true, 'Withdrawal requests fetched.', formatted);
  }
}
