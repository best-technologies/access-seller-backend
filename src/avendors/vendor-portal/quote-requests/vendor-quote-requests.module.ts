import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { VendorQuoteRequestsController } from './vendor-quote-requests.controller';
import { VendorQuoteRequestsService } from './vendor-quote-requests.service';

/**
 * Supplier-facing module for responding to admin-issued RFQs.
 * Exposes `/vendor/quote-requests/*`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [VendorQuoteRequestsController],
  providers: [VendorPortalGuard, VendorQuoteRequestsService],
})
export class VendorQuoteRequestsModule {}
