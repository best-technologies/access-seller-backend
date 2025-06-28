import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Get, Param } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { affiliateInitiatePaystackPayment, PaymentDataDto, verifyPaystackPaymentDto } from '../shared/dto/payment.dto';
import { JwtGuard } from 'src/auth/guard';
import { Request } from 'express';

@Controller('paystack')
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Post('initialise-paystack-payment')
  async initiatePayment(@Body() paymentData: PaymentDataDto, req: Request) {
    return this.paystackService.initiatePayment(paymentData, req);
  }

  @Post('affiliate-initialise-paystack-payment')
  async affiliateInitiatePaystackPayment(@Body() paymentData: affiliateInitiatePaystackPayment) {
    return this.paystackService.affiliateInitiatePaystackPayment(paymentData);
  }

  @Post('verify-paystack-funding')
    verifyPaystackFunding(@Body() dto: verifyPaystackPaymentDto) {
        return this.paystackService.verifyPaystackFunding(dto)
    }

  @Get('order/:id')
  async getOrderById(@Param('id') id: string) {
    return this.paystackService.getOrderById(id);
  }
}
