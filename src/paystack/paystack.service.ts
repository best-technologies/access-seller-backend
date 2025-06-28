import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from "colors"
import { affiliateInitiatePaystackPayment, PaymentDataDto, verifyPaystackPaymentDto } from '../shared/dto/payment.dto';
import { ProductsService } from '../admin/products/products.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount, formatDate } from 'src/shared/helper-functions/formatter';

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
      const storeId = product.storeId;
      if (!storeId) {
        throw new Error('Product is not linked to a store');
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

      // Start a transaction to revert back in case of a problem
      const { order, user, paystackResponse } = await this.prisma.$transaction(async (tx) => {
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

        // 2. Create the order (initially, without paystack fields)
        const order = await tx.order.create({
          data: {
            userId: user.id,
            productid: productId,
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

        // 4. Initialise paystack payment
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

          // 5. Update the order with paystack fields
          await tx.order.update({
            where: { id: order.id },
            data: {
              paystackReference: paystackResponse.data.data.reference,
              paystackAuthorizationUrl: paystackResponse.data.data.authorization_url,
              paystackAccessCode: paystackResponse.data.data.access_code,
            }
          });
        } catch (error) {
          // handle error if needed
        }

        return { order, user, paystackResponse };
      });

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

        // if(existingOrder.orderPaymentStatus === "success") {
        //     console.log(colors.red("Order payment status already verified"));
        //     return new ApiResponse(false, "Transaction already verified");
        // }

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

        // update the payment ststaus in db to success
        const updatedOrder = await this.prisma.order.update({
            where: { paystackReference: dto.reference },
            data: { 
              orderPaymentStatus: "paid",
              updatedAt: new Date() 
            },
            include: {
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
        if (updatedOrder.trackingNumber) {
          try {
            // Find the affiliate link by slug
            const affiliateLink = await this.prisma.affiliateLink.findUnique({
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
              const commissionAmount = (updatedOrder.total * commissionPercentage) / 100;
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
}
