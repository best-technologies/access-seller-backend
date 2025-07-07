import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../auth/guard';
import { GetUserOrdersDto } from './dto/get-user-orders.dto';
import { UserOrdersResponseDto } from './dto/user-orders-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getUserOrders(@Request() req, @Query() query: GetUserOrdersDto): Promise<ApiResponse<UserOrdersResponseDto>> {
    return this.orderService.getUserOrders(req.user, query);
  }
}
