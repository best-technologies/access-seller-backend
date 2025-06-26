import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';
import { RequestCommissionPayoutDto, CommissionPayoutResponseDto } from './dto/commission-payout.dto';
import { AffiliateStatus } from '@prisma/client';

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
            commissions: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      // 4. Format table analysis
      const tableAnalysis = recentOrders.map(order => ({
        orderId: order.id,
        buyerName: order.user.first_name + ' ' + order.user.last_name,
        buyerEmail: order.user.email,
        orderAmount: order.total,
        commissionEarned: order.commissions
          .filter(c => c.userId === user.id)
          .reduce((sum, c) => sum + c.amount, 0),
        orderDate: order.createdAt,
        status: order.status
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
        tableAnalysis,
        
      };

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
}
