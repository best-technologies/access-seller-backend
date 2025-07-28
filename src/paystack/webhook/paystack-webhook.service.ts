import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';
import { formatAmount, formatDate } from 'src/shared/helper-functions/formatter';
import { sendOrderConfirmationToBuyer, sendOrderNotificationToAdmin, sendReferralUsedMail } from 'src/common/mailer/send-mail';

@Injectable()
export class PaystackWebhookService {
  private readonly logger = new Logger(PaystackWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify Paystack webhook signature for security
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
      if (!secret) {
        this.logger.error('Paystack secret key not configured');
        return false;
      }

      const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Process Paystack webhook payload
   */
  async processWebhook(payload: any): Promise<void> {
    this.logger.log('Processing webhook payload');

    // Extract webhook data
    const { event, data } = payload;

    if (!event || !data) {
      throw new BadRequestException('Invalid webhook payload');
    }

    this.logger.log(`Webhook event: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await this.handleSuccessfulPayment(data);
        break;
      
      case 'transfer.success':
        await this.handleSuccessfulTransfer(data);
        break;
      
      case 'transfer.failed':
        await this.handleFailedTransfer(data);
        break;
      
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
        break;
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handleSuccessfulPayment(data: any): Promise<void> {
    this.logger.log('Processing successful payment webhook');

    const { reference, amount, customer, metadata } = data;

    if (!reference) {
      this.logger.error('No reference found in webhook data');
      return;
    }

    try {
      // Find the order by Paystack reference
      const order = await this.prisma.order.findFirst({
        where: { paystackReference: reference },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        this.logger.error(`Order not found for reference: ${reference}`);
        return;
      }

      // Check if payment is already processed
      if (order.orderPaymentStatus === 'completed') {
        this.logger.log(`Payment already processed for order: ${order.id}`);
        return;
      }

      // Verify amount matches
      const expectedAmount = Math.round(order.total_amount * 100);
      const paidAmount = amount;

      if (paidAmount !== expectedAmount) {
        this.logger.error(`Amount mismatch. Expected: ${expectedAmount}, Paid: ${paidAmount}`);
        return;
      }

      // Update order status
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          orderPaymentStatus: 'completed',
          shipmentStatus: 'processing',
          updatedAt: new Date()
        },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Reduce stock for each product
      for (const item of updatedOrder.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Handle commission for affiliate/referral
      await this.handleCommission(updatedOrder);

      // Send notification emails
      await this.sendNotificationEmails(updatedOrder);

      this.logger.log(`Payment processed successfully for order: ${order.id}`);

    } catch (error) {
      this.logger.error(`Error processing successful payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle commission for affiliate/referral payments
   */
  private async handleCommission(order: any): Promise<void> {
    try {
      let commissionAmount: number | undefined;
      let affiliateLink: any = null;
      let referralCodeOwner: any = null;

      // Check for referral code
      if (order.referralCode) {
        this.logger.log(`Processing commission for referral code: ${order.referralCode}`);
        
        const commissionPercentage = parseFloat(process.env.AFFILIATE_COMMISSION_PERCENT || '20');
        commissionAmount = (order.total_amount * commissionPercentage) / 100;

        referralCodeOwner = await this.prisma.referralCode.findUnique({
          where: { code: order.referralCode },
          include: { user: true }
        });

        if (referralCodeOwner && referralCodeOwner.user) {
          // Create commission referral record
          await this.prisma.commissionReferral.create({
            data: {
              userId: referralCodeOwner.userId,
              orderId: order.id,
              type: 'referral_code',
              totalPurchaseAmount: order.total_amount,
              commissionPercentage: commissionPercentage.toString(),
              amount: commissionAmount,
              status: 'awaiting_approval',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });

          // Update wallet
          let wallet = await this.prisma.wallet.findUnique({
            where: { userId: referralCodeOwner.userId }
          });

          if (!wallet) {
            wallet = await this.prisma.wallet.create({
              data: {
                userId: referralCodeOwner.userId,
                total_earned: 0,
                available_for_withdrawal: 0,
                commission_awaiting_approval: 0,
                total_withdrawn: 0,
                balance_before: 0,
                balance_after: 0,
              }
            });
          }

          const newTotalEarned = (wallet?.total_earned || 0) + commissionAmount;
          const newAwaitingApproval = (wallet?.commission_awaiting_approval || 0) + commissionAmount;

          await this.prisma.wallet.update({
            where: { userId: referralCodeOwner.userId },
            data: {
              total_earned: newTotalEarned,
              commission_awaiting_approval: newAwaitingApproval,
              updatedAt: new Date()
            }
          });

          this.logger.log(`Commission awarded: ${commissionAmount} to referral code owner ${referralCodeOwner.userId}`);

          // Send referral used email
          await this.sendReferralEmail(order, referralCodeOwner, commissionAmount);
        }
      }

      // Check for affiliate link (if order has referralSlug)
      if (order.referralSlug) {
        this.logger.log(`Processing commission for affiliate link: ${order.referralSlug}`);
        
        affiliateLink = await this.prisma.affiliateLink.findUnique({
          where: { slug: order.referralSlug },
          include: {
            user: true,
            product: true
          }
        });

        if (affiliateLink) {
          const orderItem = order.items[0];
          const productCommission = orderItem.product.commission;
          const commissionPercentage = productCommission ? parseFloat(productCommission) : parseFloat(process.env.AFFILIATE_COMMISSION_PERCENT || '20');
          commissionAmount = (order.total_amount * commissionPercentage) / 100;

          // Create commission referral record
          await this.prisma.commissionReferral.create({
            data: {
              userId: affiliateLink.userId,
              orderId: order.id,
              productId: orderItem.productId,
              type: 'affiliate_link',
              totalPurchaseAmount: order.total_amount,
              commissionPercentage: commissionPercentage.toString(),
              amount: commissionAmount,
              status: 'awaiting_approval',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });

          // Update wallet
          let wallet = await this.prisma.wallet.findUnique({
            where: { userId: affiliateLink.userId }
          });

          if (!wallet) {
            wallet = await this.prisma.wallet.create({
              data: {
                userId: affiliateLink.userId,
                total_earned: 0,
                available_for_withdrawal: 0,
                balance_before: 0,
                balance_after: 0,
              }
            });
          }

          const amountEarned = (order.total_amount || 0) * commissionPercentage / 100;
          const newTotalEarned = (wallet?.total_earned || 0) + amountEarned;
          const newAvailableForWithdrawal = (wallet?.available_for_withdrawal || 0) + amountEarned;
          const newBalanceBefore = wallet?.balance_after || 0;
          const newBalanceAfter = newBalanceBefore + amountEarned;

          await this.prisma.wallet.update({
            where: { userId: affiliateLink.userId },
            data: {
              total_earned: newTotalEarned,
              available_for_withdrawal: newAvailableForWithdrawal,
              balance_before: newBalanceBefore,
              balance_after: newBalanceAfter,
              updatedAt: new Date()
            }
          });

          // Update affiliate link stats
          await this.prisma.affiliateLink.update({
            where: { id: affiliateLink.id },
            data: {
              orders: {
                increment: 1
              },
              commission: {
                increment: commissionAmount
              }
            }
          });

          this.logger.log(`Commission awarded: ${commissionAmount} to affiliate ${affiliateLink.userId}`);

          // Send referral used email
          await this.sendReferralEmail(order, affiliateLink, commissionAmount);
        }
      }

    } catch (error) {
      this.logger.error(`Error handling commission: ${error.message}`);
    }
  }

  /**
   * Send referral used email
   */
  private async sendReferralEmail(order: any, affiliateData: any, commissionAmount: number): Promise<void> {
    try {
      let productImageUrl = '';
      if (order.items && order.items.length > 0 && order.items[0].product && order.items[0].product.displayImages) {
        const images = Array.isArray(order.items[0].product.displayImages)
          ? order.items[0].product.displayImages
          : (typeof order.items[0].product.displayImages === 'string' ? JSON.parse(order.items[0].product.displayImages) : []);
        if (images && images.length > 0) {
          productImageUrl = typeof images[0] === 'string' ? images[0] : images[0].url || images[0].secureUrl || '';
        }
      }

      await sendReferralUsedMail({
        affiliateName: affiliateData.user?.first_name + ' ' + affiliateData.user?.last_name,
        affiliateEmail: affiliateData.user?.email,
        orderId: order.orderId || '',
        productName: order.items[0]?.product?.name || '',
        productImageUrl,
        buyerName: order.user ? `${order.user.first_name} ${order.user.last_name}` : '',
        buyerEmail: order.user?.email || '',
        purchaseAmount: order.total_amount || 0,
        purchaseDate: new Date(order.updatedAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
        channel: order.referralCode ? 'referral code' : 'affiliate link'
      }, affiliateData.user?.email);
    } catch (error) {
      this.logger.error(`Error sending referral email: ${error.message}`);
    }
  }

  /**
   * Send notification emails
   */
  private async sendNotificationEmails(order: any): Promise<void> {
    try {
      // Prepare email data
      const shippingAddressString = (order.shippingInfo && typeof order.shippingInfo === 'object' && 'address' in order.shippingInfo)
        ? String(order.shippingInfo.address)
        : '';
      const shippingState = (order.shippingInfo && typeof order.shippingInfo === 'object' && 'state' in order.shippingInfo) ? String(order.shippingInfo.state) : '';
      const shippingCity = (order.shippingInfo && typeof order.shippingInfo === 'object' && 'city' in order.shippingInfo) ? String(order.shippingInfo.city) : '';
      const shippingHouseAddress = (order.shippingInfo && typeof order.shippingInfo === 'object' && 'houseAddress' in order.shippingInfo) ? String(order.shippingInfo.houseAddress) : '';

      const emailData = {
        orderId: order.orderId || "",
        firstName: order.user?.first_name || '',
        lastName: order.user?.last_name || '',
        email: order.user?.email || '',
        orderTotal: formatAmount(order.total_amount ?? 0),
        state: shippingState,
        city: shippingCity,
        houseAddress: shippingHouseAddress,
        trackingNumber: order.trackingNumber || undefined,
        paymentStatus: order.orderPaymentStatus || 'paid',
        shippingAddress: shippingAddressString,
        orderCreated: formatDate(order.createdAt),
        updatedAt: formatDate(order.updatedAt),
        productName: order.items[0]?.product?.name,
        quantity: order.items[0]?.quantity,
      };

      // Send order confirmation email to buyer
      await sendOrderConfirmationToBuyer(emailData);

      // Send order notification email to admin
      await sendOrderNotificationToAdmin(emailData);

      this.logger.log('Notification emails sent successfully');
    } catch (error) {
      this.logger.error(`Error sending notification emails: ${error.message}`);
    }
  }

  /**
   * Handle successful transfer webhook
   */
  private async handleSuccessfulTransfer(data: any): Promise<void> {
    this.logger.log('Processing successful transfer webhook');
    // Handle transfer success logic here
  }

  /**
   * Handle failed transfer webhook
   */
  private async handleFailedTransfer(data: any): Promise<void> {
    this.logger.log('Processing failed transfer webhook');
    // Handle transfer failure logic here
  }
} 