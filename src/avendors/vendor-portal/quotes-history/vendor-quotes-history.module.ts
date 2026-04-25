import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { VendorQuotesHistoryController } from './vendor-quotes-history.controller';
import { VendorQuotesHistoryService } from './vendor-quotes-history.service';

/**
 * Supplier-facing module for the Quotes History screen.
 * Exposes `/vendor/quotes-history/*`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [VendorQuotesHistoryController],
  providers: [VendorPortalGuard, VendorQuotesHistoryService],
})
export class VendorQuotesHistoryModule {}
