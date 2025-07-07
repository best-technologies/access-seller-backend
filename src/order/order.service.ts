import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { GetUserOrdersDto } from './dto/get-user-orders.dto';
import { UserOrdersResponseDto, UserOrderDto } from './dto/user-orders-response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrders(user: any, query: GetUserOrdersDto): Promise<ApiResponse<UserOrdersResponseDto>> {
    console.log(colors.cyan('Fetching user orders...'), { userEmail: user.email });

    try {
      const {
        page = 1,
        limit = 25,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      // Get user from email
      const existingUser = await this.prisma.user.findFirst({ 
        where: { email: user.email } 
      });

      if (!existingUser) {
        console.log(colors.red('User not found.'));
        return new ApiResponse(false, 'User not found.');
      }

      // Build where clause
      const whereClause: any = {
        userId: existingUser.id
      };

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate);
        if (endDate) whereClause.createdAt.lte = new Date(endDate);
      }

      if (minAmount || maxAmount) {
        whereClause.total = {};
        if (minAmount) whereClause.total.gte = minAmount;
        if (maxAmount) whereClause.total.lte = maxAmount;
      }

      // Get orders with pagination
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          skip,
          take: limit,
          where: whereClause,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    isbn: true,
                    publisher: true,
                    displayImages: true
                  }
                }
              }
            }
          },
          orderBy: { [sortBy]: sortOrder }
        }),
        this.prisma.order.count({ where: whereClause })
      ]);

      // Transform orders to match response format
      const transformedOrders: UserOrderDto[] = orders.map(order => ({
        id: order.id,
        // orderId: order.orderId,
        status: order.status,
        total: order.total,
        shippingAddress: order.shippingAddress,
        state: order.state,
        city: order.city,
        houseAddress: order.houseAddress,
        orderPaymentStatus: order.orderPaymentStatus,
        trackingNumber: order.trackingNumber,
        withdrawalStatus: order.withdrawalStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productIsbn: item.product.isbn,
          productPublisher: item.product.publisher,
          displayImage: (item.product.displayImages as any)?.[0]?.secure_url,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt
        }))
      }));

      const totalPages = Math.ceil(total / limit);

      console.log(colors.magenta(`User orders fetched successfully. Page ${page} of ${totalPages}`));

      const formatted_response: UserOrdersResponseDto = {
        pagination: {
          currentPage: page,
          totalPages,
          perPage: limit,
          totalItems: total
        },
        orders: transformedOrders
      };

      return new ApiResponse(
        true,
        "User orders fetched successfully",
        formatted_response
      );

    } catch (error) {
      console.log(colors.red('Error fetching user orders:'), error);
      return new ApiResponse(
        false,
        'Failed to fetch user orders.'
      );
    }
  }
}
