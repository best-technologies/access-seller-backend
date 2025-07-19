import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import axios from 'axios';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from "colors"
import { affiliateInitiatePaystackPayment, PaymentDataDto, verifyPaystackPaymentDto } from '../shared/dto/payment.dto';
import { ProductsService } from '../admin/products/products.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '../shared/services/cloudinary.service';
import type { CloudinaryUploadResult } from '../shared/services/cloudinary.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount, formatDate } from 'src/shared/helper-functions/formatter';
import { sendOrderConfirmationToBuyer, sendOrderNotificationToAdmin } from 'src/common/mailer/send-mail';
import { CheckoutFromCartDto, VerifyAccountNumberDto } from './dto/paystack.dto';
import * as argon2 from 'argon2';
import { generateOrderId, generateTrackingId } from '../shared/helper-functions/generator';
import { OrderStatus, ShipmentStatus } from '@prisma/client';


@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async initiatePayment(paymentData: PaymentDataDto, req: any) {
    this.logger.log("Initiating a new payment");

    // Check product stock before proceeding
    for (const item of paymentData.items) {
      const productRes = await this.productsService.getProductById(item.productId);
      const product = productRes?.data;
      if (!product) {
        return ResponseHelper.error(`Product with ID ${item.productId} not found`, null, 404);
      }
      if (item.quantity > product.stock) {
        return ResponseHelper.error(
          `The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`,
          null,
          400
        );
      }
    }

    try {
      const amount = Math.round(paymentData.payNow * 100);
      const email = req.email;
      const payload = {
        email,
        amount,
        metadata: {
          items: paymentData.items,
          paymentPercent: paymentData.paymentPercent,
          payLater: paymentData.payLater,
          total: paymentData.total,
        },
      };
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Paystack response: ${JSON.stringify(response.data?.data)}`);
      this.logger.log("New payment successfully initiated");
      return ResponseHelper.success('Payment initiated', response.data.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to initiate payment';
      return ResponseHelper.error(message, error.response?.data, error.response?.status || 500);
    }
  }

  async affiliateInitiatePaystackPayment(paymentData: affiliateInitiatePaystackPayment) {
    this.logger.log("Initalising new paystack payment for referred user");

    const {
      productId,
      firstName,
      lastName,
      email,
      phoneNumber,
      state,
      city,
      houseAddress,
      fullShippingAddress,
      referralSlug,
      quantity,
      totalAmount,
      callbackUrl
    } = paymentData;

    this.logger.log(`Payment data: ${JSON.stringify(paymentData)}`);

    try {
      // Fetch the product to get the storeId, price, and stock
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      // 1. Quantity check
      if (quantity > product.stock) {
        throw new Error(`Requested quantity (${quantity}) exceeds available stock (${product.stock})`);
      }

      // 2. Total amount check
      const expectedTotal = quantity * product.sellingPrice;
      if (totalAmount !== expectedTotal) {
        throw new Error(`Total amount mismatch. Expected: ${expectedTotal}, Received: ${totalAmount}`);
      }

      // 3. Create user/order/orderItem in a transaction
      const { order, user } = await this.prisma.$transaction(async (tx) => {
        // Ensure product has a storeId (inside transaction)
        let storeId = product.storeId;
        if (!storeId) {
          this.logger.log("store id not found, updating");
          const firstStore = await tx.store.findFirst();
          this.logger.log(`First store id: ${firstStore?.id}`);
          if (!firstStore) {
            throw new Error('No store found in the database to attach to the product');
          }
          await tx.product.update({
            where: { id: productId },
            data: { storeId: firstStore.id },
          });
          storeId = firstStore.id;
          this.logger.log(`[paystack-service] Product had no storeId. Attached first store (${storeId}) to product ${productId}`);
        }

        // 1. Check if user exists, else create a guest user
        let user = await tx.user.findUnique({ where: { email } });
        if (!user) {
          // Generate a guest password using parts of user info
          const firstPart = (firstName || '').slice(0, 2);
          const lastPart = (lastName || '').slice(0, 2);
          const emailPart = (email || '').split('@')[0].slice(0, 3);
          const phonePart = (phoneNumber || '').slice(-4);
          const plainPassword = `${firstPart}${lastPart}${emailPart}${phonePart}${Math.floor(Math.random() * 1000)}`;
          // Hash the password using argon2
          const hashedPassword = await argon2.hash(plainPassword);

          user = await tx.user.create({
            data: {
              email,
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              address: fullShippingAddress,
              role: "user",
              password: hashedPassword,
              guest_password: plainPassword, // Save the plain password for later use
            }
          });
        }

        // generate unique order id
        let orderId: string = '';
        while (true) {
          orderId = generateOrderId();
          const exists = await tx.order.findFirst({ where: { orderId } });
          if (!exists) break;
        }
        this.logger.log(`Order id: ${orderId}`);

        // generate unique tracking number
        let trackingNumber: string = '';
        while (true) {
          trackingNumber = generateTrackingId();
          const exists = await tx.order.findFirst({ where: { trackingNumber } });
          if (!exists) break;
        }
        this.logger.log(`Tracking number: ${trackingNumber}`);

        // 2. Create the order (initially, without paystack fields)
        const order = await tx.order.create({
          data: {
            userId: user.id,
            productid: productId,
            orderId: orderId,
            storeId: storeId,
            orderStatus: 'pending',
            total_amount: totalAmount,
            total: totalAmount,
            shippingInfo: { address: fullShippingAddress, state, city, houseAddress },
            referralSlug: referralSlug || undefined,
            trackingNumber: trackingNumber,
          }
        });

        // 3. Create the order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: productId,
            quantity: quantity,
            price: product.sellingPrice,
          }
        });

        return { order, user };
      });

      // 4. Initialise paystack payment (outside transaction)
      const amount = Math.round(totalAmount * 100);
      const payload = {
        email,
        amount,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
        metadata: {
          orderId: order.id,
          productId,
          referralSlug,
          firstName,
          lastName,
          phoneNumber,
          state,
          city,
          houseAddress,
          fullShippingAddress,
        },
      };

      this.logger.log(`Paystack payload: ${JSON.stringify(payload)}`);

      let paystackResponse: any;

      try {
        paystackResponse = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        // 5. Update the order with paystack fields (outside transaction)
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paystackReference: paystackResponse.data.data.reference,
            paystackAuthorizationUrl: paystackResponse.data.data.authorization_url,
            paystackAccessCode: paystackResponse.data.data.access_code,
          }
        });
      } catch (error) {
        this.logger.error(`Paystack initialize error: ${JSON.stringify(error.response?.data || error.message)}`);
        throw new Error(error.response?.data?.message || error.message);
      }

      const formattedResponse = {
        orderId: order.id,
        userId: user.id,
        paystackResponse: paystackResponse?.data.data
      }
      this.logger.log(`Formatted Paystack Response: ${JSON.stringify(formattedResponse)}`);

      this.logger.log("New paystack successfully initiated")
      return new ApiResponse(
        true, 
        'New paystack successfully initiated', 
        formattedResponse
      );

    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to initiate affiliate payment';
      this.logger.error(`Error in affiliate payment initiation: ${message}`);
      return ResponseHelper.error(message, error.response?.data, error.response?.status || 500);
    }
  }

  async verifyAffiliatePaystackPayment(dto: verifyPaystackPaymentDto) {
    this.logger.log("Verifying affiliate paystack payment");

    // this.logger.log(`Dto: ${dto.reference}`);

    try {
        // Fetch the transaction from the database
        const existingOrder = await this.prisma.order.findFirst({
            where: { paystackReference: dto.reference }
        });

        // console.log(colors.blue("Existing order: "), existingOrder)

        // Validate transaction existence and amount
        if (!existingOrder || !existingOrder.total_amount) {
            this.logger.warn("Order not found or amount is missing");
            throw new NotFoundException("Order not found or amount is missing");
        }

        // Determine expected amount (handle partial payment)
        let expectedAmount = existingOrder.total_amount;
        // let isPartialPayment = false;
        if (existingOrder.isPartialPayment && existingOrder.partialPayNow) {
          expectedAmount = existingOrder.partialPayNow;
          // isPartialPayment = true;
        }

        if(existingOrder.orderPaymentStatus === "completed") {
            this.logger.warn("Order payment status already verified");
            return new ApiResponse(false, "Transaction already verified");
        }

        const amountInKobo = Math.round(expectedAmount * 100);

        if (!dto.reference) {
            throw new BadRequestException("Transaction reference is missing");
        }

        // Verify transaction with Paystack
        let response: any;
        try {
            response = await axios.get(`https://api.paystack.co/transaction/verify/${dto.reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
                }
            });
        } catch (error) {
            this.logger.error(`Error verifying transaction with Paystack: ${error}`);
            throw new Error(`Failed to verify transaction with Paystack: ${error.message}`);
        }

        // Extract relevant data from Paystack response
        const { status: paystackStatus, amount: paystackKoboAmount } = response.data?.data;

        if (paystackStatus !== 'success') {
            this.logger.warn("Payment was not completed or successful");
            return new ApiResponse(false, "Payment was not completed or successful");
        }

        // this.logger.log(`Paystack kobo amount: ${paystackKoboAmount}`);
        // this.logger.log(`amount in kobo: ${amountInKobo}`);

        // update the payment status in db to success
        const updatedOrder = await this.prisma.order.update({
            where: { paystackReference: dto.reference },
            data: { 
              orderPaymentStatus: "completed",
              shipmentStatus: "processing",
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

        // Reduce stock for each product in the order
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

        // Award commission if there's a referral slug
        let commissionAmount: number | undefined;
        let affiliateLink: any = null;
        
        if (updatedOrder.referralSlug) {
          this.logger.log(`affiliate slug exist: ${updatedOrder.referralSlug}`);
          try {
            // Find the affiliate link by slug
            affiliateLink = await this.prisma.affiliateLink.findUnique({
              where: { slug: updatedOrder.referralSlug },
              include: {
                user: true,
                product: true
              }
            });

            if (affiliateLink) {
              this.logger.log("Affiliate link exists");
              
              // Get the product from the order items to get its commission percentage
              const orderItem = updatedOrder.items[0]; // Since affiliate orders have single items
              const productCommission = orderItem.product.commission;
              
              // Calculate commission using the product's commission percentage
              const commissionPercentage = productCommission ? parseFloat(productCommission) : 20; // Default to 20% if not set
              commissionAmount = (updatedOrder.total_amount * commissionPercentage) / 100;
              this.logger.log(`order total value: ${existingOrder.total_amount}`);
              this.logger.log(`commission amount: ${commissionAmount}`);

              // Create commission referral record
              await this.prisma.commissionReferral.create({
                data: {
                  userId: affiliateLink.userId,
                  orderId: updatedOrder.id,
                  productId: orderItem.productId,
                  type: 'affiliate_link',
                  totalPurchaseAmount: updatedOrder.total,
                  commissionPercentage: commissionPercentage.toString(),
                  amount: commissionAmount,
                  status: 'awaiting_approval',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              });

              // update users wallet
              let wallet = await this.prisma.wallet.findUnique({ where: { userId: affiliateLink.userId } });
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
              const amountEarned = (updatedOrder.total || 0) * commissionPercentage / 100;
              const newTotalEarned = (wallet?.total_earned || 0) + amountEarned;
              const newAvailableForWithdrawal = (wallet?.available_for_withdrawal || 0) + amountEarned;
              const newBalanceBefore = wallet?.balance_after || 0;
              const newBalanceAfter = newBalanceBefore + amountEarned;
              
              await this.prisma.wallet.update({
                where: { userId: affiliateLink.userId },
                data: {
                  total_earned: newTotalEarned,
                  available_for_withdrawal: newAvailableForWithdrawal,
                  // awaiting_approval: ,
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
            }
          } catch (error) {
            this.logger.error(`Error awarding commission: ${error}`);
          }
        }

        this.logger.log(`Transaction amount: , ${existingOrder.total_amount}`); 

        const formattedResponse = {
          id: updatedOrder.id,
          amount: formatAmount(updatedOrder.total_amount ?? 0),
          description: "Payment for order purchase",
          status: "success",
          payment_method: "paystack",
          date: formatDate(updatedOrder.updatedAt)
        }

        this.logger.log("Payment verified successfully");

        // Prepare email data
        const shippingAddressString = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'address' in updatedOrder.shippingInfo)
          ? String(updatedOrder.shippingInfo.address)
          : '';
        const shippingState = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'state' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.state) : '';
        const shippingCity = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'city' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.city) : '';
        const shippingHouseAddress = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'houseAddress' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.houseAddress) : '';
        const emailData = {
          orderId: updatedOrder.id,
          firstName: updatedOrder.user?.first_name || '',
          lastName: updatedOrder.user?.last_name || '',
          email: updatedOrder.user?.email || '',
          orderTotal: formatAmount(updatedOrder.total_amount ?? 0),
          state: shippingState,
          city: shippingCity,
          houseAddress: shippingHouseAddress,
          trackingNumber: updatedOrder.trackingNumber || undefined,
          paymentStatus: updatedOrder.orderPaymentStatus || 'paid',
          shippingAddress: shippingAddressString,
          orderCreated: formatDate(updatedOrder.createdAt),
          updatedAt: formatDate(updatedOrder.updatedAt),
          productName: updatedOrder.items[0]?.product?.name,
          quantity: updatedOrder.items[0]?.quantity,
          commissionAmount: commissionAmount ? formatAmount(commissionAmount) : undefined,
          affiliateUserId: affiliateLink?.userId
        };

        // Send order confirmation email to buyer
        try {
          await sendOrderConfirmationToBuyer(emailData);
          // console.log(colors.green("Order confirmation email sent to buyer"));
        } catch (error) {
          // console.log(colors.red("Error sending order confirmation email to buyer:"), error);
        }

        // Send order notification email to admin
        try {
          await sendOrderNotificationToAdmin(emailData);
          this.logger.log("Order notification email sent to admin");
        } catch (error) {
          this.logger.error(`Error sending order notification email to admin: ${error}`);
        }

        return new ApiResponse(true, "Payment verified successfully", formattedResponse);

    } catch (error) {
        this.logger.error(`Verification error: ${error.message}`);
        throw new Error(`Verification error: ${error.message}`);
    }
  }

  async checkoutFromCartWithPaystackInitialisation(dto: CheckoutFromCartDto) {
    this.logger.log("Checking out from cart with paystack initialisation");
    // 1. Validate all products exist and have enough stock
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return ResponseHelper.error(`Product with ID ${item.productId} not found`, null, 404);
      }
      if (item.quantity > product.stock) {
        return ResponseHelper.error(
          `The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`,
          null,
          400
        );
      }
    }

    // --- Move non-DB operations outside transaction ---
    // Prepare user info
    let user = await this.prisma.user.findFirst({ where: { email: dto.shippingInfo?.email } });
    let userId = user?.id;
    let userForOrder = user;
    let createdUser = false;
    if (!user) {
      // Hash password outside transaction
      const plainPassword = 'maximus123';
      const hashedPassword = await argon2.hash(plainPassword);
      user = await this.prisma.user.create({
        data: {
          email: dto.shippingInfo?.email || '',
          first_name: dto.shippingInfo?.firstName || '',
          last_name: dto.shippingInfo?.lastName || '',
          phone_number: dto.shippingInfo?.phone || '',
          address: dto.shippingInfo?.address || '',
          password: hashedPassword,
          guest_password: plainPassword,
          role: 'user',
        }
      });
      userId = user.id;
      userForOrder = user;
      createdUser = true;
    }
    if (!userId) {
      this.logger.error("User ID could not be determined for order creation")
      throw new Error('User ID could not be determined for order creation');
    }

    // generate unique order id
    let orderId: string = '';
    while (true) {
      orderId = generateOrderId();
      const exists = await this.prisma.order.findFirst({ where: { orderId } });
      if (!exists) break;
    }
    this.logger.log(`Order id: ${orderId}`);

    // Generate unique tracking number outside transaction
    let trackingNumber = '';
    for (let i = 0; i < 5; i++) { // Try up to 5 times
      const candidate = generateTrackingId();
      const exists = await this.prisma.order.findFirst({ where: { trackingNumber: candidate } });
      if (!exists) {
        trackingNumber = candidate;
        break;
      }
    }
    if (!trackingNumber) {
      throw new Error('Failed to generate unique tracking number');
    }

    // --- Start transaction for DB-only operations ---
    const { order } = await this.prisma.$transaction(async (tx) => {
      // Find or create shipping address
      let shippingAddressId: string | undefined = undefined;
      if (dto.shippingInfo && userId) {
        let shippingAddress = await tx.shippingAddress.findFirst({
          where: {
            userId,
            address: dto.shippingInfo.address || '',
            city: dto.shippingInfo.city || '',
            state: dto.shippingInfo.state || '',
            houseAddress: dto.shippingInfo.houseAddress || '',
          }
        });
        if (!shippingAddress) {
          shippingAddress = await tx.shippingAddress.create({
            data: {
              userId,
              firstName: dto.shippingInfo.firstName || '',
              lastName: dto.shippingInfo.lastName || '',
              email: dto.shippingInfo.email || '',
              phone: dto.shippingInfo.phone || '',
              state: dto.shippingInfo.state || '',
              city: dto.shippingInfo.city || '',
              houseAddress: dto.shippingInfo.houseAddress || '',
              address: dto.shippingInfo.address || '',
            }
          });
        }
        shippingAddressId = shippingAddress.id;
      }

      // Find storeId from first product or fallback to first store
      let storeId: string | undefined = undefined;
      if (dto.items.length > 0) {
        const firstProduct = await tx.product.findUnique({ where: { id: dto.items[0].productId } });
        if (firstProduct && firstProduct.storeId) {
          storeId = firstProduct.storeId;
        }
      }
      if (!storeId) {
        const firstStore = await tx.store.findFirst();
        if (!firstStore) throw new Error('No store found in the database to attach to the order.');
        storeId = firstStore.id;
      }

      // Prepare order data
      const orderData: any = {
        orderStatus: 'pending',
        orderId,
        // total: dto.total,
        total_amount: dto.total,
        shippingInfo: dto.shippingInfo || {},
        orderPaymentStatus: 'awaiting_payment',
        shipmentStatus: "awaiting_payment",
        trackingNumber,
        isPartialPayment: !!dto.partialPayment,
        partialPayNow: dto.partialPayment?.payNow,
        partialPayLater: dto.partialPayment?.payLater,
        partialAllowedPercent: dto.partialPayment?.allowedPercentage,
        partialSelectedPercent: dto.partialPayment?.selectedPercentage,
        fullPayNow: dto.fullPayment?.payNow,
        fullPayLater: dto.fullPayment?.payLater,
        referralCode: dto.referralCode,
        shippingCost: dto.shipping || 0,
        promoCode: dto.promoCode,
        promoDiscountPercent: dto.promoDiscountPercent,
        promoDiscountAmount: dto.promoDiscountAmount,
        user: { connect: { id: userId } },
        store: { connect: { id: storeId } },
      };
      if (shippingAddressId) {
        orderData.shippingAddress = { connect: { id: shippingAddressId } };
      }
      // console.log("orderData just before create:", orderData);
      const order = await tx.order.create({ data: orderData });

      // Create order items
      await Promise.all(dto.items.map(item =>
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity,
          }
        })
      ));

      return { order };
    }, { timeout: 20000 }); // 20 seconds

    // 3. Prepare Paystack payload
    const amount = Math.round((dto.partialPayment?.payNow || dto.total) * 100);
    const payload = {
      email: userForOrder?.email,
      callback_url: dto.callbackUrl,
      amount,
      metadata: {
        orderId: order.id,
        userId: userForOrder?.id,
        items: dto.items,
        promoCode: dto.promoCode,
        promoDiscountPercent: dto.promoDiscountPercent,
        promoDiscountAmount: dto.promoDiscountAmount,
        subtotal: dto.subtotal,
        shipping: dto.shipping,
        total: dto.total,
        partialPayment: dto.partialPayment,
        fullPayment: dto.fullPayment,
      },
    };

    // 4. Initialise Paystack payment
    let paystackResponse: any;
    try {
      paystackResponse = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 5. Update the order with paystack fields
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paystackReference: paystackResponse.data.data.reference,
          paystackAuthorizationUrl: paystackResponse.data.data.authorization_url,
          paystackAccessCode: paystackResponse.data.data.access_code,
        }
      });
    } catch (error) {
      console.error('Paystack initialize error:', error.response?.data || error.message);
      return ResponseHelper.error(error.response?.data?.message || error.message, error.response?.data, error.response?.status || 500);
    }

    // 6. Return formatted response
    const formattedResponse = {
      orderId: order.id,
      userId: userForOrder?.id,
      paystackResponse: paystackResponse?.data.data
    };

    this.logger.log("New order successfully created")
    return new ApiResponse(
      true,
      'Cart checkout payment successfully initiated',
      formattedResponse
    );
  }

  async verifyCartPayment(dto: verifyPaystackPaymentDto) {

    this.logger.log("Verifying cart checkout payment with paystack");

    this.logger.log(`Dto: ${dto.reference}`);

    try {
        // Fetch the transaction from the database
        const existingOrder = await this.prisma.order.findFirst({
            where: { paystackReference: dto.reference }
        });

        // Validate transaction existence and amount
        if (!existingOrder || !existingOrder.total_amount) {
            this.logger.warn("Order not found or amount is missing");
            throw new NotFoundException("Order not found or amount is missing");
        }

        if(existingOrder.orderPaymentStatus === "completed") {
            this.logger.warn("Order payment status already verified");
            return new ApiResponse(false, "Transaction already verified");
        }

        const amountInKobo = existingOrder.total_amount * 100;

        // Verify transaction with Paystack
        let response: any;
        try {
            response = await axios.get(`https://api.paystack.co/transaction/verify/${dto.reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
                }
            });
        } catch (error) {
            this.logger.error(`Error verifying transaction with Paystack: ${error}`);
            throw new Error(`Failed to verify transaction with Paystack: ${error.message}`);
        }

        // Extract relevant data from Paystack response
        const { status: paystackStatus, amount: paystackKoboAmount } = response.data?.data;

        if (paystackStatus !== 'success') {
            this.logger.warn("Payment was not completed or successful");
            return new ApiResponse(false, "Payment was not completed or successful");
        }

        // Determine if this is a partial payment
        const isPartialPayment = !!existingOrder.isPartialPayment && !!existingOrder.partialPayNow;
        const partialPayNowKobo = existingOrder.partialPayNow ? Math.round(existingOrder.partialPayNow * 100) : null;

        // Log expected and actual payment amounts
        this.logger.log(`Expected amount (kobo): ${amountInKobo}`);
        this.logger.log(`Paystack paid amount (kobo): ${paystackKoboAmount}`);
        if (isPartialPayment) {
          this.logger.log(`Partial pay now (kobo): ${partialPayNowKobo}`);
        }

        // Validate that the amount paid matches the expected amount (allow full or partial payment)
        if (Math.round(paystackKoboAmount) !== Math.round(amountInKobo)) {
          if (!(isPartialPayment && Math.round(paystackKoboAmount) === Math.round(partialPayNowKobo ?? 0)) &&
              !(isPartialPayment && Math.round(paystackKoboAmount) === Math.round(amountInKobo))) {
            this.logger.warn("Amount mismatch detected");
            return new ApiResponse(false, "Payment amount does not match transaction amount");
          }
        }

        if (!dto.reference) {
            throw new BadRequestException("Transaction reference is missing");
        }

        // update the payment status in db to success
        const updatedOrder = await this.prisma.order.update({
            where: { paystackReference: dto.reference },
            data: { 
              orderPaymentStatus: "completed",
              shipmentStatus: "processing",
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

        // Reduce stock for each product in the order
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

        // Award commission if there's a referral slug or referral code
        let commissionAmount: number | undefined;
        let affiliateLink: any = null;
        let referralCodeOwner: any = null;
        let commissionType: string | undefined;

        // Check for referral code (referral code owner)
        if (updatedOrder.referralCode) {
          this.logger.log(`Referral code exists: ${updatedOrder.referralCode}`);
          const commissionPercentage = parseFloat(process.env.AFFILIATE_COMMISSION_PERCENT || '20');
          this.logger.log(`Set commission percentage: ${commissionPercentage}`);
          commissionAmount = (updatedOrder.total_amount * commissionPercentage) / 100;

          try {
            referralCodeOwner = await this.prisma.referralCode.findUnique({ where: { code: updatedOrder.referralCode }, include: { user: true } });
            if (referralCodeOwner && referralCodeOwner.user) {
              commissionType = 'referral_code';
              

              // Create commission referral record
              
              await this.prisma.commissionReferral.create({
                data: {
                  userId: referralCodeOwner.userId,
                  orderId: updatedOrder.id,
                  type: commissionType,
                  totalPurchaseAmount: updatedOrder.total,
                  commissionPercentage: commissionPercentage.toString(),
                  amount: commissionAmount,
                  status: 'awaiting_approval',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              });

              // amount earned should be the commission amount (not commissionPercentage * total)
              const amountEarned = commissionAmount;
              this.logger.log(`Total purchase cost: ${updatedOrder.total_amount}`);
              this.logger.log(`Total referral earning: ${amountEarned}`);
              
              
              // update users wallet (logic unchanged)
              let wallet = await this.prisma.wallet.findUnique({ where: { userId: referralCodeOwner.userId } });
              if (!wallet) {
                wallet = await this.prisma.wallet.create({
                  data: {
                    userId: referralCodeOwner.userId,
                    total_earned: 0,
                    available_for_withdrawal: 0,
                    awaiting_approval: 0,
                    total_withdrawn: 0,
                    balance_before: 0,
                    balance_after: 0,
                  }
                });
              }
              this.logger.log(`Referree initial wallet balance: ${JSON.stringify(wallet)}`);

              const newTotalEarned = (wallet?.total_earned || 0) + amountEarned;
              const newAwaitingApproval = (wallet?.awaiting_approval || 0) + amountEarned

              const updatedWallet = await this.prisma.wallet.update({
                where: { userId: referralCodeOwner.userId },
                data: {
                  total_earned: newTotalEarned,
                  awaiting_approval: newAwaitingApproval,
                  updatedAt: new Date()
                }
              });

              this.logger.log(`Referree final wallet balance: ${JSON.stringify(updatedWallet)}`);

              this.logger.log(`Commission awarded: ${commissionAmount} to referral code owner ${referralCodeOwner.userId}`);
            }
          } catch (error) {
            this.logger.error(`Error awarding commission for referral code: ${error}`);
          }
        }

        this.logger.log(`Transaction amount: , ${existingOrder.total_amount}`); 

        const formattedResponse = {
          id: updatedOrder.id,
          amount: formatAmount(updatedOrder.total_amount ?? 0),
          description: "Payment for order purchase",
          status: "success",
          payment_method: "paystack",
          date: formatDate(updatedOrder.updatedAt)
        }

        this.logger.log("Payment verified successfully");

        // Prepare email data
        const shippingAddressString = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'address' in updatedOrder.shippingInfo)
          ? String(updatedOrder.shippingInfo.address)
          : '';
        const shippingState = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'state' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.state) : '';
        const shippingCity = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'city' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.city) : '';
        const shippingHouseAddress = (updatedOrder.shippingInfo && typeof updatedOrder.shippingInfo === 'object' && 'houseAddress' in updatedOrder.shippingInfo) ? String(updatedOrder.shippingInfo.houseAddress) : '';
        const emailData = {
          orderId: updatedOrder.id,
          firstName: updatedOrder.user?.first_name || '',
          lastName: updatedOrder.user?.last_name || '',
          email: updatedOrder.user?.email || '',
          orderTotal: formatAmount(updatedOrder.total_amount ?? 0),
          state: shippingState,
          city: shippingCity,
          houseAddress: shippingHouseAddress,
          trackingNumber: updatedOrder.trackingNumber || undefined,
          paymentStatus: updatedOrder.orderPaymentStatus || 'paid',
          shippingAddress: shippingAddressString,
          orderCreated: formatDate(updatedOrder.createdAt),
          updatedAt: formatDate(updatedOrder.updatedAt),
          productName: updatedOrder.items[0]?.product?.name,
          quantity: updatedOrder.items[0]?.quantity,
          commissionAmount: commissionAmount ? formatAmount(commissionAmount) : undefined,
          affiliateUserId: affiliateLink?.userId
        };

        // Send order confirmation email to buyer
        try {
          await sendOrderConfirmationToBuyer(emailData);
          // console.log(colors.green("Order confirmation email sent to buyer"));
        } catch (error) {
          console.log(colors.red("Error sending order confirmation email to buyer:"), error);
        }

        // Send order notification email to admin
        try {
          await sendOrderNotificationToAdmin(emailData);
          // console.log(colors.green("Order notification email sent to admin"));
        } catch (error) {
          this.logger.error(`Error sending order notification email to admin: ${error}`);
        }

        return new ApiResponse(true, "Payment verified successfully", formattedResponse);

    } catch (error) {
        this.logger.error(`Verification error: ${error.message}`);
        throw new Error(`Verification error: ${error.message}`);
    }

  }

  async manualBankDeposit(dto: CheckoutFromCartDto, files: Array<Express.Multer.File>) {
    this.logger.log("Manual bank deposit checkout initiated");
    // 1. Validate all products exist and have enough stock
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return ResponseHelper.error(`Product with ID ${item.productId} not found`, null, 404);
      }
      if (item.quantity > product.stock) {
        return ResponseHelper.error(
          `The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`,
          null,
          400
        );
      }
    }

    // Upload files to Cloudinary
    let uploadedFiles: CloudinaryUploadResult[] = [];
    if (files && files.length > 0) {
      uploadedFiles = await this.cloudinaryService.uploadToCloudinary(files, 'acces-sellr/bank-deposits');
    }

    // Prepare user info
    let user = await this.prisma.user.findFirst({ where: { email: dto.shippingInfo?.email } });
    let userId = user?.id;
    let userForOrder = user;
    let createdUser = false;
    if (!user) {
      // Hash password outside transaction
      const plainPassword = 'maximus123';
      const hashedPassword = await argon2.hash(plainPassword);
      user = await this.prisma.user.create({
        data: {
          email: dto.shippingInfo?.email || '',
          first_name: dto.shippingInfo?.firstName || '',
          last_name: dto.shippingInfo?.lastName || '',
          phone_number: dto.shippingInfo?.phone || '',
          address: dto.shippingInfo?.address || '',
          password: hashedPassword,
          guest_password: plainPassword,
          role: 'user',
        }
      });
      userId = user.id;
      userForOrder = user;
      createdUser = true;
    }
    if (!userId) {
      this.logger.error("User ID could not be determined for order creation")
      throw new Error('User ID could not be determined for order creation');
    }

    // generate unique order id
    let orderId: string = '';
    while (true) {
      orderId = generateOrderId();
      const exists = await this.prisma.order.findFirst({ where: { orderId } });
      if (!exists) break;
    }
    this.logger.log(`Order id: ${orderId}`);

    // Generate unique tracking number outside transaction
    let trackingNumber = '';
    for (let i = 0; i < 5; i++) { // Try up to 5 times
      const candidate = generateTrackingId();
      const exists = await this.prisma.order.findFirst({ where: { trackingNumber: candidate } });
      if (!exists) {
        trackingNumber = candidate;
        break;
      }
    }
    if (!trackingNumber) {
      throw new Error('Failed to generate unique tracking number');
    }

    // --- Start transaction for DB-only operations ---
    const { order } = await this.prisma.$transaction(async (tx) => {
      // Find or create shipping address
      let shippingAddressId: string | undefined = undefined;
      if (dto.shippingInfo && userId) {
        let shippingAddress = await tx.shippingAddress.findFirst({
          where: {
            userId,
            address: dto.shippingInfo.address || '',
            city: dto.shippingInfo.city || '',
            state: dto.shippingInfo.state || '',
            houseAddress: dto.shippingInfo.houseAddress || '',
          }
        });
        if (!shippingAddress) {
          shippingAddress = await tx.shippingAddress.create({
            data: {
              userId,
              firstName: dto.shippingInfo.firstName || '',
              lastName: dto.shippingInfo.lastName || '',
              email: dto.shippingInfo.email || '',
              phone: dto.shippingInfo.phone || '',
              state: dto.shippingInfo.state || '',
              city: dto.shippingInfo.city || '',
              houseAddress: dto.shippingInfo.houseAddress || '',
              address: dto.shippingInfo.address || '',
            }
          });
        }
        shippingAddressId = shippingAddress.id;
      }

      // Find storeId from first product or fallback to first store
      let storeId: string | undefined = undefined;
      if (dto.items.length > 0) {
        const firstProduct = await tx.product.findUnique({ where: { id: dto.items[0].productId } });
        if (firstProduct && firstProduct.storeId) {
          storeId = firstProduct.storeId;
        }
      }
      if (!storeId) {
        const firstStore = await tx.store.findFirst();
        if (!firstStore) throw new Error('No store found in the database to attach to the order.');
        storeId = firstStore.id;
      }

      // Prepare order data
      const orderData: any = {
        orderStatus: 'pending',
        orderId,
        // total: dto.total,
        total_amount: dto.total,
        shippingInfo: dto.shippingInfo || {},
        orderPaymentStatus: 'awaiting_verification',
        shipmentStatus: "awaiting_verification",
        trackingNumber,
        paymentMethod: "bank_deposit",
        isPartialPayment: !!dto.partialPayment,
        partialPayNow: dto.partialPayment?.payNow,
        partialPayLater: dto.partialPayment?.payLater,
        partialAllowedPercent: dto.partialPayment?.allowedPercentage,
        partialSelectedPercent: dto.partialPayment?.selectedPercentage,
        fullPayNow: dto.fullPayment?.payNow,
        fullPayLater: dto.fullPayment?.payLater,
        referralCode: dto.referralCode,
        shippingCost: dto.shipping || 0,
        promoCode: dto.promoCode,
        promoDiscountPercent: dto.promoDiscountPercent,
        promoDiscountAmount: dto.promoDiscountAmount,
        user: { connect: { id: userId } },
        store: { connect: { id: storeId } },
        bankDepositSlips: uploadedFiles.map(f => ({ publicId: f.public_id, secureUrl: f.secure_url })),
      };
      if (shippingAddressId) {
        orderData.shippingAddress = { connect: { id: shippingAddressId } };
      }
      const order = await tx.order.create({ data: orderData });

      let commissionAmount: number | undefined;
      let referralCodeOwner: any = null;
      let commissionType: string | undefined;

      if (order.referralCode) {
        this.logger.log(`Referral code exists: ${order.referralCode}`);
        const commissionPercentage = parseFloat(process.env.AFFILIATE_COMMISSION_PERCENT || '20');
        this.logger.log(`Set commission percentage: ${commissionPercentage}`);
        commissionAmount = (order.total_amount * commissionPercentage) / 100;

        try {
          referralCodeOwner = await this.prisma.referralCode.findUnique({ where: { code: order.referralCode }, include: { user: true } });
          if (referralCodeOwner && referralCodeOwner.user) {
            commissionType = 'referral_code';
            

            // Create commission referral record
            
            await this.prisma.commissionReferral.create({
              data: {
                userId: referralCodeOwner.userId,
                orderId: order.id,
                type: commissionType,
                totalPurchaseAmount: order.total,
                commissionPercentage: commissionPercentage.toString(),
                amount: commissionAmount,
                status: 'awaiting_approval',
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            });

            // amount earned should be the commission amount (not commissionPercentage * total)
            const amountEarned = commissionAmount;
            this.logger.log(`Total purchase cost: ${order.total_amount}`);
            this.logger.log(`Total referral earning: ${amountEarned}`);
            
            
            // update users wallet (logic unchanged)
            let wallet = await this.prisma.wallet.findUnique({ where: { userId: referralCodeOwner.userId } });
            if (!wallet) {
              wallet = await this.prisma.wallet.create({
                data: {
                  userId: referralCodeOwner.userId,
                  total_earned: 0,
                  available_for_withdrawal: 0,
                  awaiting_approval: 0,
                  total_withdrawn: 0,
                  balance_before: 0,
                  balance_after: 0,
                }
              });
            }
            this.logger.log(`Referree initial wallet balance: ${JSON.stringify(wallet)}`);

            const newTotalEarned = (wallet?.total_earned || 0) + amountEarned;
            const newAwaitingApproval = (wallet?.awaiting_approval || 0) + amountEarned

            const updatedWallet = await this.prisma.wallet.update({
              where: { userId: referralCodeOwner.userId },
              data: {
                total_earned: newTotalEarned,
                awaiting_approval: newAwaitingApproval,
                updatedAt: new Date()
              }
            });

            this.logger.log(`Referree final wallet balance: ${JSON.stringify(updatedWallet)}`);

            this.logger.log(`Commission awarded: ${commissionAmount} to referral code owner ${referralCodeOwner.userId}`);
          }
        } catch (error) {
          this.logger.error(`Error awarding commission for referral code: ${error}`);
        }
      }

      // Create order items
      await Promise.all(dto.items.map(item =>
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity,
          }
        })
      ));

      return { order };
    }, { timeout: 50000 }); // 20 seconds

    // 6. Return formatted response
    const formattedResponse = {
      orderId: order.id,
      userId: userForOrder?.id,
      bankDepositSlips: uploadedFiles.map(f => ({ publicId: f.public_id, secureUrl: f.secure_url }))
    };

    this.logger.log("Manual bank deposit order successfully created")
    return new ApiResponse(
      true,
      'Bank deposit order created, awaiting verification',
    );
  }

  // /////////////////////////////// Manual payment
  

  async getOrderById(orderId: string) {

    this.logger.log('[paystack-service] Fetching order by ID...');

    try {
      const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
      if (!order) {
        this.logger.warn('[paystack-service] Order not found.');
        return new ApiResponse(false, 'Order not found.');
      }

      const formattedOrder = {
        id: order.id,
        firstName: order.user?.first_name,
        lastName: order.user?.last_name,
        email: order.user?.email,
        orderTotal: formatAmount(order.total_amount),
        state: (order.shippingInfo && typeof order.shippingInfo === 'object' && 'state' in order.shippingInfo) ? String(order.shippingInfo.state) : '',
        city: (order.shippingInfo && typeof order.shippingInfo === 'object' && 'city' in order.shippingInfo) ? String(order.shippingInfo.city) : '',
        houseAddress: (order.shippingInfo && typeof order.shippingInfo === 'object' && 'houseAddress' in order.shippingInfo) ? String(order.shippingInfo.houseAddress) : '',
        trackingNumber: order.trackingNumber,
        paymentStatus: order.orderPaymentStatus,
        shippingAddress: (order.shippingInfo && typeof order.shippingInfo === 'object' && 'address' in order.shippingInfo) ? order.shippingInfo.address : '',
        orderCreated: formatDate(order.createdAt),
        updatedAt: formatDate(order.updatedAt),
      };
      
      this.logger.log('[paystack-service] Order fetched successfully.');
      return new ApiResponse(true, 'Order fetched successfully.', formattedOrder);
    } catch (error) {
      this.logger.error(`[paystack-service] Error fetching order: ${error}`);
      return new ApiResponse(false, 'Failed to fetch order.');
    }
  }

  async fetchAllBanks() {
    this.logger.log("Fetching all banks...");

    let response: any;

    try {
          response = await axios.get(`https://api.paystack.co/bank`, {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
    } catch (error) {
      this.logger.error(`Error fetching banks: ${error}`);
      return new ApiResponse(false, "Error fetching banks");
    }

    this.logger.log(`Response: ${JSON.stringify(response.data)}`);

        const { status, data } = response.data;
        if(!status) {
            this.logger.error(`Error fetching banks:`);
            return new ApiResponse(false, "Error fetching banks");
        }

        const formattedPaystackBanks = data.map(bank => ({
            id: bank.id,
            name: bank.name,
            code: bank.code
        }));

        this.logger.log("Fetched all banks successfully");

        return new ApiResponse(true, "Fetched all banks successfully", formattedPaystackBanks);
  }

  async verifyAccountNumberPaystack(dto: VerifyAccountNumberDto, userPayload: any) {
    this.logger.log("User verifying account number");

    const reqBody = {
        account_number: dto.account_number,
        bank_code: dto.bank_code
    }

    try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
            params: reqBody,
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        if (status) {
            this.logger.log(`Account name successfully retrieved: ${data.account_name}`);
            return new ApiResponse(true, "Bank details verified successfully", data.account_name);
        } else {
            this.logger.warn(`Failed to verify bank details: ${data.message}`);
            return new ApiResponse(false, `Failed to verify bank details: ${data.message}`);
        }
    } catch (error) {
        // Handle the error message and extract the response message
        if (error.response && error.response.data && error.response.data.message) {
            this.logger.error(error.response.data.message);
            return new ApiResponse(false, error.response.data.message);
        } else {
            // For unexpected errors
            this.logger.error(`Unexpected error verifying bank details: ${error}`);
            return new ApiResponse(false, "An unexpected error occurred while verifying bank details");
        }
    }
  }
}
