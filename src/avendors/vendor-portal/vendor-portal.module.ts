import { Module } from '@nestjs/common';
import { VendorDashboardModule } from './dashboard/vendor-dashboard.module';
import { VendorInventoryModule } from './inventory/vendor-inventory.module';
import { VendorProfileModule } from './profile/vendor-profile.module';
import { VendorQuoteRequestsModule } from './quote-requests/vendor-quote-requests.module';
import { VendorQuotesHistoryModule } from './quotes-history/vendor-quotes-history.module';

/**
 * Root module for the supplier-facing vendor portal (lives under `avendors/`).
 * Shares Prisma models; uses {@link VendorPortalGuard} for supplier access.
 */
@Module({
  imports: [
    VendorDashboardModule,
    VendorInventoryModule,
    VendorProfileModule,
    VendorQuoteRequestsModule,
    VendorQuotesHistoryModule,
  ],
})
export class VendorPortalModule {}
