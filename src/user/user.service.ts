import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';
import { RequestCommissionPayoutDto, } from './dto/commission-payout.dto';
import { AffiliateStatus } from '@prisma/client';
import { formatAmount, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import { AddBankDto, DeleteBankDto, UpdateBankStatusDto } from './dto/bank.dto';
import { RequestWithdrawalDto, PayoutMethod } from './dto/withdrawal-request.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserAllowedPartialpayment(payload) {

    console.log(colors.cyan("Fetching user details for payment"))

    try {
        
        const existingUser = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true, allowedPartialPayment: true }
        });

        const formattedUser = {
            id: existingUser?.id,
            allowedPartialPayment: existingUser?.allowedPartialPayment
        }

        console.log(colors.magenta("Users partial payment details retrieved"))
        return new ApiResponse(
            true,
            "User partial opayment details successfully fetched",
            formattedUser
        )

    } catch (error) {
        console.log(colors.red("Error fetching details: "), error)
        return new ApiResponse(
            false,
            "Error fetching partial payment details "
        )
    }
  }

  async requestToBecomeAnAffiliate(dto: requestAffiliatePermissionDto, payload: any) {

    console.log(colors.cyan("requesting to become an affiliate"), dto)

    try {
      // Fetch user
      const user = await this.prisma.user.findFirst({ where: { email: payload.email } });
      if (!user) {
        return new ApiResponse(false, 'User not found.');
      }
      if (user.isAffiliate) {
        console.log(colors.red("User is already an affiliate"))
        return new ApiResponse(false, 'You are already an affiliate.');
      }
      if (user.affiliateStatus === 'pending') {
        console.log(colors.red("You already have a pending affiliate request."))
        return new ApiResponse(false, 'You already have a pending affiliate request.');
      }
      // Check if there is already a pending Affiliate
      const existingRequest = await this.prisma.affiliate.findFirst({
        where: { userId: user.id, status: 'pending' }
      });
      if (existingRequest) {
        console.log(colors.red("You already have a pending affiliate request."))
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

      console.log(colors.magenta("Successfully requested for affiliate permission"))
      return new ApiResponse(
        true,
        'Affiliate request submitted and is awaiting approval.',
        formattedResponse
      );
    } catch (error) {
      console.log(colors.red('Error requesting affiliate status'), error);
      return new ApiResponse(
        false,
        'Failed to submit affiliate request.'
      );
    }
  }

  async fetchAffiliateDashboard(payload: any) {
    console.log(colors.cyan("Fetching affiliate dashboard"));
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

      // 2. Fetch affiliate record
      const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: user.id } });

      // 3. Fetch stats and recent orders
      const [totalPurchases, totalEarned, totalWithdrawn, pendingWithdrawals, recentOrders] = await Promise.all([
        this.prisma.order.count({
          where: {
            commissions: { some: { userId: user.id } }
          }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id, status: 'paid' }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id, status: 'pending' }
        }),
        this.prisma.order.findMany({
          where: {
            commissions: { some: { userId: user.id } }
          },
          include: {
            user: { select: { first_name: true, last_name: true, email: true } },
            commissions: true,
            items: {
              select: {
                product: { select: { displayImages: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      // 4. Format table analysis
      const tableAnalysis = recentOrders.map(order => {
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 2);
        const approved = order.createdAt < fourDaysAgo;
        return {
          id: order.id,
          // orderId: order.orderId,
          buyerName: order.user.first_name + ' ' + order.user.last_name,
          buyerEmail: order.user.email,
          orderAmount: formatAmount(order.total),
          withdrawalStatus: order.withdrawalStatus,
          displayImage: order.items?.[0]?.product?.displayImages?.[0]?.secure_url,
          commissionEarned: formatAmount(order.commissions
            .filter(c => c.userId === user.id)
            .reduce((sum, c) => sum + c.amount, 0)),
          orderDate: formatDateWithoutTime(order.createdAt),
          status: approved ? order.status : "inactive",
          approved,
        };
      });

      // 6. Fetch payouts (withdrawal requests)
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

      // 5. Build response
      const dashboard = {
        is_affiliate: user.isAffiliate,
        affiliate_status: user.affiliateStatus,
        createdAt: affiliate?.createdAt || null,
        affiliate,
        stats: {
          totalPurchases,
          totalEarned: totalEarned._sum.amount || 0,
          totalWithdrawn: totalWithdrawn._sum.amount || 0,
          pendingWithdrawals: pendingWithdrawals._sum.amount || 0
        },
        banks: bankDetails || [],
        tableAnalysis,
        payouts
      };

      // console.log('Affiliate dashboard fetched successfully.', dashboard)

      return new ApiResponse(true, 'Affiliate dashboard fetched successfully.', dashboard);
    } catch (error) {
      console.log(colors.red('Error fetching affiliate dashboard'), error);
      return new ApiResponse(false, 'Failed to fetch affiliate dashboard.');
    }
  }

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

        let base_url: string;
        if(process.env.NODE_ENV === "development") {
          base_url = process.env.FRONTEND_BASE_URL_DEV || ""
        } else {
          base_url = process.env.FRONTEND_BASE_URL_PROD || ""
        }

        // Construct shareable link
        const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
        const productSlug = product.id;
        const shareableLink = `${baseUrl}/products/${productSlug}?ref=${link.slug}`;
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

  async getAffiliateLinksForUser(user: any) {
    console.log(colors.cyan('[user-service] Fetching affiliate links for user...'));
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
      
        console.log(colors.green(`Total of ${links.length} Affiliate links fetched successfully.`));
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
      console.log(colors.cyan('[user-service] Adding new bank for user...'));
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        console.log(colors.red('[user-service] User not found.'));
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
        console.log(colors.red('[user-service] Bank with this account number and bank code already exists for user.'));
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
      console.log(colors.green('[user-service] Bank added successfully.'));
      return new ApiResponse(true, 'Bank added successfully.', bank);
    } catch (error) {
      console.log(colors.red('[user-service] Error adding bank:'), error);
      return new ApiResponse(false, 'Failed to add bank.');
    }
  }

  async deleteBank(user: any, dto: DeleteBankDto) {
    try {
      console.log(colors.cyan('[user-service] Deleting bank for user...'), dto.bankId);

      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        console.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }
      // Ensure the bank belongs to the user
      const bank = await this.prisma.bank.findFirst({ where: { bankCode: dto.bankId, userId: existingUser.id } });
      if (!bank) {
        console.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }

      await this.prisma.bank.delete({ where: { bankCode: dto.bankId } });

      console.log(colors.green('[user-service] Bank deleted successfully.'));
      return new ApiResponse(true, 'Bank deleted successfully.');

    } catch (error) {
      console.log(colors.red('[user-service] Error deleting bank:'), error);
      return new ApiResponse(false, 'Failed to delete bank.');
    }
  }

  async updateBankStatus(user: any, dto: UpdateBankStatusDto) {
    try {
      console.log(colors.cyan('[user-service] Updating bank status for user...'));
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        console.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }
      // Ensure the bank belongs to the user
      const bank = await this.prisma.bank.findFirst({ where: { id: dto.bankId, userId: existingUser.id } });
      if (!bank) {
        console.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }
      // The Bank model does not have an isActive field
      console.log(colors.red('[user-service] Bank status cannot be updated because the Bank model does not have an isActive field.'));
      return new ApiResponse(false, 'Bank status cannot be updated because the Bank model does not have an isActive field.');
    } catch (error) {
      console.log(colors.red('[user-service] Error updating bank status:'), error);
      return new ApiResponse(false, 'Failed to update bank status.');
    }
  }

  // //////////////////////////////////////////////////////////////////////// Request withdrawal
  async requestWithdrawal(user: any, dto: RequestWithdrawalDto) {
    try {
      console.log(colors.cyan('[user-service] Creating withdrawal request...'), dto);
      
      const existingUser = await this.prisma.user.findFirst({ where: { email: user.email } });
      if (!existingUser) {
        console.log(colors.red('[user-service] User not found.'));
        return new ApiResponse(false, 'User not found.');
      }

      // Validate order exists (do not check userId)
      const order = await this.prisma.order.findFirst({
        where: { id: dto.orderId },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          commissions: { where: { userId: existingUser.id } }
        }
      });

      if (!order) {
        console.log(colors.red('[user-service] Order not found.'));
        return new ApiResponse(false, 'Order not found.');
      }

      // Get commission for this order and user
      const commission = order.commissions[0];
      if (!commission) {
        console.log(colors.red('[user-service] No commission found for this order and user.'));
        return new ApiResponse(false, 'No commission found for this order and user.');
      }

      const bank = await this.prisma.bank.findFirst({
        where: { bankCode: dto.bankCode, userId: existingUser.id }
      });

      if (!bank) {
        console.log(colors.red('[user-service] Bank not found or does not belong to user.'));
        return new ApiResponse(false, 'Bank not found or does not belong to user.');
      }

      // Check if withdrawal request already exists for this order
      const existingRequest = await this.prisma.withdrawalRequest.findFirst({
        where: { orderId: dto.orderId, userId: existingUser.id }
      });

      if (existingRequest) {
        console.log(colors.red('[user-service] Withdrawal request already exists for this order.'));
        return new ApiResponse(false, 'Withdrawal request already exists for this order.');
      }

      // Generate unique payoutId
      function generatePayoutId() {
        return `out/acc${Math.random().toString(36).substring(2, 8)}`;
      }

      // Generate unique reference
      const reference = `acc-withdraw-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const payoutId = generatePayoutId();

      // Create withdrawal request and update order status in a transaction
      const { withdrawalRequest } = await this.prisma.$transaction(async (tx) => {
        // Create withdrawal request
        const withdrawalRequest = await tx.withdrawalRequest.create({
          data: {
            userId: existingUser.id,
            orderId: dto.orderId,
            commissionId: commission.id,
            buyerName: `${order.user.first_name} ${order.user.last_name}`,
            buyerEmail: order.user.email,
            totalPurchaseAmount: order.total,
            commissionAmount: commission.amount,
            commissionPercentage: commission.commissionPercentage,
            payoutMethod: "bank transfer",
            bankId: bank.id,
            reference,
            payoutId, // Store the generated payoutId
            payoutStatus: 'pending',
          },
          include: {
            order: { select: { id: true, total: true } },
            commission: { select: { amount: true, commissionPercentage: true } },
            bank: { select: { bankName: true, accountNumber: true, accountName: true } }
          }
        });

        // Update order withdrawal status to 'processing'
        await tx.order.update({
          where: { id: dto.orderId },
          data: { withdrawalStatus: 'processing' }
        });

        return { withdrawalRequest };
      });

      console.log(colors.green('[user-service] Withdrawal request created successfully.'));
      return new ApiResponse(true, 'Withdrawal request created successfully.', withdrawalRequest);

    } catch (error) {
      console.log(colors.red('[user-service] Error creating withdrawal request:'), error);
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
