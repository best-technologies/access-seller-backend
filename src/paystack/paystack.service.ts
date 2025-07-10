import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from "colors"
import { affiliateInitiatePaystackPayment, PaymentDataDto, verifyPaystackPaymentDto } from '../shared/dto/payment.dto';
import { ProductsService } from '../admin/products/products.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount, formatDate } from 'src/shared/helper-functions/formatter';
import { sendOrderConfirmationToBuyer, sendOrderNotificationToAdmin } from 'src/common/mailer/send-mail';
import { VerifyAccountNumberDto } from './dto/paystack.dto';

@Injectable()
export class PaystackService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  async initiatePayment(paymentData: PaymentDataDto, req: any) {
    console.log(colors.cyan("Initiating a new payment"));

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
      console.log("Paystack response: ", response);
      console.log(colors.magenta("New payment successfully initiated"));
      return ResponseHelper.success('Payment initiated', response.data.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to initiate payment';
      return ResponseHelper.error(message, error.response?.data, error.response?.status || 500);
    }
  }

  async affiliateInitiatePaystackPayment(paymentData: affiliateInitiatePaystackPayment) {
    console.log(colors.cyan("Initalising new paystack payment for referred user"));

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

    console.log("Payment data: ", paymentData)

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
          console.log(colors.blue("store id not found, updating"));
          const firstStore = await tx.store.findFirst();
          console.log(colors.yellow("First store id: "), firstStore?.id)
          if (!firstStore) {
            throw new Error('No store found in the database to attach to the product');
          }
          await tx.product.update({
            where: { id: productId },
            data: { storeId: firstStore.id },
          });
          storeId = firstStore.id;
          console.log(colors.yellow(`[paystack-service] Product had no storeId. Attached first store (${storeId}) to product ${productId}`));
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
          const argon2 = require('argon2');
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

        // generate order id in this format acc/slr/<randomletterand number(6)> and it must be unique
        const orderId = `acc/slr/${Math.random().toString(36).substring(2, 8)}`;
        console.log(colors.yellow("Order id: "), orderId)

        // 2. Create the order (initially, without paystack fields)
        const order = await tx.order.create({
          data: {
            userId: user.id,
            productid: productId,
            // orderId: orderId,
            storeId: storeId,
            status: 'pending',
            total_amount: totalAmount,
            total: totalAmount,
            shippingAddress: fullShippingAddress,
            state,
            city,
            referralSlug,
            houseAddress,
            trackingNumber: referralSlug || undefined,
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

      console.log(colors.blue("Paystack payload: "), payload)

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
        console.error('Paystack initialize error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
      }

      const formattedResponse = {
        orderId: order.id,
        userId: user.id,
        paystackResponse: paystackResponse?.data.data
      }
      console.log(colors.yellow('Formatted Paystack Response:'), formattedResponse);

      console.log(colors.magenta("New paystack successfully initiated"))
      return new ApiResponse(
        true, 
        'New paystack successfully initiated', 
        formattedResponse
      );

    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to initiate affiliate payment';
      console.log(colors.red('Error in affiliate payment initiation:'), message);
      return ResponseHelper.error(message, error.response?.data, error.response?.status || 500);
    }
  }

  async verifyPaystackFunding(dto: verifyPaystackPaymentDto) {
    console.log(colors.cyan("Verifying wallet funding with Paystack"));

    console.log("Dto: ", dto.reference)

    try {
        // Fetch the transaction from the database
        const existingOrder = await this.prisma.order.findFirst({
            where: { paystackReference: dto.reference }
        });

        // Validate transaction existence and amount
        if (!existingOrder || !existingOrder.total) {
            console.log(colors.red("Order not found or amount is missing"));
            throw new NotFoundException("Order not found or amount is missing");
        }

        if(existingOrder.orderPaymentStatus === "success") {
            console.log(colors.red("Order payment status already verified"));
            return new ApiResponse(false, "Transaction already verified");
        }

        const amountInKobo = existingOrder.total * 100;

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
            console.error(colors.red(`Error verifying transaction with Paystack: ${error}`));
            throw new Error(`Failed to verify transaction with Paystack: ${error.message}`);
        }

        // Extract relevant data from Paystack response
        const { status: paystackStatus, amount: paystackKoboAmount } = response.data?.data;

        if (paystackStatus !== 'success') {
            console.log(colors.red("Payment was not completed or successful"));
            return new ApiResponse(false, "Payment was not completed or successful");
        }

        console.log("Paystack kobo amount: ", paystackKoboAmount)
        console.log("amount in kobo: ", amountInKobo)

        // Validate that the amount paid matches the expected amount
        if (paystackKoboAmount !== amountInKobo) {
            console.log(colors.red("Amount mismatch detected"));
            return new ApiResponse(false, "Payment amount does not match transaction amount");
        }

        // update the payment status in db to success
        const updatedOrder = await this.prisma.order.update({
            where: { paystackReference: dto.reference },
            data: { 
              orderPaymentStatus: "paid",
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
        
        if (updatedOrder.trackingNumber) {
          try {
            // Find the affiliate link by slug
            affiliateLink = await this.prisma.affiliateLink.findUnique({
              where: { slug: updatedOrder.trackingNumber },
              include: {
                user: true,
                product: true
              }
            });

            if (affiliateLink) {
              console.log(colors.yellow("Affiliate link exists"))
              
              // Get the product from the order items to get its commission percentage
              const orderItem = updatedOrder.items[0]; // Since affiliate orders have single items
              const productCommission = orderItem.product.commission;
              
              // Calculate commission using the product's commission percentage
              const commissionPercentage = productCommission ? parseFloat(productCommission) : 20; // Default to 20% if not set
              commissionAmount = (updatedOrder.total * commissionPercentage) / 100;
              console.log("order total value: ",existingOrder.total_amount)
              console.log("commission amount: ",commissionAmount)

              // Create commission record
              await this.prisma.commission.create({
                data: {
                  userId: affiliateLink.userId,
                  orderId: updatedOrder.id,
                  totalPurchaseAmount: updatedOrder.total,
                  commissionPercentage: commissionPercentage.toString(),
                  amount: commissionAmount,
                  status: 'pending'
                }
              });

              // update users wallet
              const wallet = await this.prisma.wallet.findUnique({ where: { userId: affiliateLink.userid } });
              const amountEarned = 1000; // Replace with actual earned amount logic
              const newTotalEarned = (wallet?.total_earned || 0) + amountEarned;
              const newAvailableForWithdrawal = (wallet?.available_for_withdrawal || 0) + amountEarned;
              const newBalanceBefore = wallet?.balance_after || 0;
              const newBalanceAfter = newBalanceBefore + amountEarned;
              
              await this.prisma.wallet.update({
                where: { userId: affiliateLink.userid },
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

              console.log(colors.green(`Commission awarded: ${commissionAmount} to affiliate ${affiliateLink.userId}`));
            }
          } catch (error) {
            console.log(colors.red('Error awarding commission:'), error);
          }
        }

        console.log(colors.cyan(`Transaction amount: , ${existingOrder.total_amount}`)); 

        const formattedResponse = {
          id: updatedOrder.id,
          amount: formatAmount(updatedOrder.total_amount ?? 0),
          description: "Payment for order purchase",
          status: "success",
          payment_method: "paystack",
          date: formatDate(updatedOrder.updatedAt)
        }

        console.log(colors.green("Payment verified successfully"));

        // Prepare email data
        const emailData = {
          orderId: updatedOrder.id,
          firstName: updatedOrder.user?.first_name || '',
          lastName: updatedOrder.user?.last_name || '',
          email: updatedOrder.user?.email || '',
          orderTotal: formatAmount(updatedOrder.total_amount ?? 0),
          state: updatedOrder.state || '',
          city: updatedOrder.city || '',
          houseAddress: updatedOrder.houseAddress || '',
          trackingNumber: updatedOrder.trackingNumber || undefined,
          paymentStatus: updatedOrder.orderPaymentStatus || 'paid',
          shippingAddress: updatedOrder.shippingAddress || '',
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
          console.log(colors.green("Order confirmation email sent to buyer"));
        } catch (error) {
          console.log(colors.red("Error sending order confirmation email to buyer:"), error);
        }

        // Send order notification email to admin
        try {
          await sendOrderNotificationToAdmin(emailData);
          console.log(colors.green("Order notification email sent to admin"));
        } catch (error) {
          console.log(colors.red("Error sending order notification email to admin:"), error);
        }

        return new ApiResponse(true, "Payment verified successfully", formattedResponse);

    } catch (error) {
        console.error(colors.red(`Verification error: ${error.message}`));
        throw new Error(`Verification error: ${error.message}`);
    }
}

  async getOrderById(orderId: string) {

    console.log(colors.cyan('[paystack-service] Fetching order by ID...'));

    try {
      const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
      if (!order) {
        console.log(colors.red('[paystack-service] Order not found.'));
        return new ApiResponse(false, 'Order not found.');
      }

      const formattedOrder = {
        id: order.id,
        firstName: order.user?.first_name,
        lastName: order.user?.last_name,
        email: order.user?.email,
        orderTotal: formatAmount(order.total_amount),
        state: order.state,
        city: order.city,
        houseAddress: order.houseAddress,
        trackingNumber: order.trackingNumber,
        paymentStatus: order.orderPaymentStatus,
        shippingAddress: order.shippingAddress,
        orderCreated: formatDate(order.createdAt),
        updatedAt: formatDate(order.updatedAt),
      };
      
      console.log(colors.magenta('[paystack-service] Order fetched successfully.'));
      return new ApiResponse(true, 'Order fetched successfully.', formattedOrder);
    } catch (error) {
      console.log(colors.red('[paystack-service] Error fetching order:'), error);
      return new ApiResponse(false, 'Failed to fetch order.');
    }
  }

  async fetchAllBanks() {
    console.log(colors.cyan("Fetching all banks..."));

    let response: any;

    try {
          response = await axios.get(`https://api.paystack.co/bank`, {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
    } catch (error) {
      console.log(colors.red("Error fetching banks: "), error);
      return new ApiResponse(false, "Error fetching banks");
    }

    console.log("Response: ", response.data);

        const { status, data } = response.data;
        if(!status) {
            console.log(colors.red(`Error fetching banks:`));
            return new ApiResponse(false, "Error fetching banks");
        }

        const formattedPaystackBanks = data.map(bank => ({
            id: bank.id,
            name: bank.name,
            code: bank.code
        }));

        console.log(colors.magenta("Fetched all banks successfully"));

        return new ApiResponse(true, "Fetched all banks successfully", formattedPaystackBanks);
  }

  async verifyAccountNumberPaystack(dto: VerifyAccountNumberDto, userPayload: any) {
    console.log("User verifying account number".blue)

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
            console.log("Account name successfully retrieved: ", data.account_name);
            return new ApiResponse(true, "Bank details verified successfully", data.account_name);
        } else {
            console.log(`Failed to verify bank details: ${data.message}`);
            return new ApiResponse(false, `Failed to verify bank details: ${data.message}`);
        }
    } catch (error) {
        // Handle the error message and extract the response message
        if (error.response && error.response.data && error.response.data.message) {
            console.error(error.response.data.message);
            return new ApiResponse(false, error.response.data.message);
        } else {
            // For unexpected errors
            console.error("Unexpected error verifying bank details", error);
            return new ApiResponse(false, "An unexpected error occurred while verifying bank details");
        }
    }
  }
}
