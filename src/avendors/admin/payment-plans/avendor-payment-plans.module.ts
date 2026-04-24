import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorPaymentPlansController } from './avendor-payment-plans.controller';
import { AvendorPaymentPlansService } from './avendor-payment-plans.service';
import { AvendorVendorQuotesController } from './avendor-vendor-quotes.controller';

/**
 * Admin UI for `AvendorPaymentPlan` CRUD and for setting a plan on a vendor quote
 * (same underlying permission model as A-Vendor RFQs: view vs full access).
 */
@Module({
  imports: [PrismaModule],
  controllers: [AvendorPaymentPlansController, AvendorVendorQuotesController],
  providers: [AvendorPaymentPlansService, AvendorPlatformGuard],
})
export class AvendorPaymentPlansModule {}
