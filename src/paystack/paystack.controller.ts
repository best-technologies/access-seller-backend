import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { affiliateInitiatePaystackPayment, PaymentDataDto, verifyPaystackPaymentDto } from '../shared/dto/payment.dto';
import { CheckoutFromCartDto } from './dto/paystack.dto';
// import { JwtGuard } from 'src/auth/guard';
import { Request } from 'express';
import { VerifyAccountNumberDto } from './dto/paystack.dto';

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

  @Post('cart-checkout-initialise-paystack-payment')
  async checkoutFromCartWithPaystackInitialisation(@Body() paymentData: CheckoutFromCartDto) {
    return this.paystackService.checkoutFromCartWithPaystackInitialisation(paymentData);
  }

  @Post('verify-paystack-funding')
  verifyAffiliatePaystackPayment(@Body() dto: verifyPaystackPaymentDto) {
        return this.paystackService.verifyAffiliatePaystackPayment(dto)
    }

  @Post('verify-cart-payment')
  async verifyCartPayment(@Body() dto: verifyPaystackPaymentDto) {
    return this.paystackService.verifyCartPayment(dto);
  }

  @Get('order/:id')
  async getOrderById(@Param('id') id: string) {
    return this.paystackService.getOrderById(id);
  }

  @Get('banks')
  async fetchAllBanks() {
    return this.paystackService.fetchAllBanks();
  }

  @Post('verify-account-number')
  async verifyAccountNumber(@Body() dto: VerifyAccountNumberDto) {
    return this.paystackService.verifyAccountNumberPaystack(dto, null);
  }
}
