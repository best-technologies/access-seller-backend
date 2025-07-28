import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, Get } from '@nestjs/common';
import { PaystackWebhookService } from './paystack-webhook.service';

@Controller('paystack/webhook')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(private readonly paystackWebhookService: PaystackWebhookService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async testWebhook() {
    return { 
      status: 'success', 
      message: 'Paystack webhook endpoint is active',
      timestamp: new Date().toISOString()
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    this.logger.log('Received Paystack webhook');
    this.logger.log(`Signature: ${signature}`);
    this.logger.log(`Payload: ${JSON.stringify(payload)}`);

    try {
      // Verify webhook signature for security
      const isValidSignature = this.paystackWebhookService.verifySignature(
        JSON.stringify(payload),
        signature
      );

      if (!isValidSignature) {
        this.logger.error('Invalid webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      // Process the webhook
      await this.paystackWebhookService.processWebhook(payload);

      this.logger.log('Webhook processed successfully');
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
} 