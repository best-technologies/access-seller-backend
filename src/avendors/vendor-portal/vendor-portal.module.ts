import { Module } from '@nestjs/common';
import { VendorDashboardModule } from './dashboard/vendor-dashboard.module';
import { VendorProfileModule } from './profile/vendor-profile.module';

/**
 * Root module for the supplier-facing vendor portal (lives under `avendors/`).
 * Shares Prisma models; uses {@link VendorPortalGuard} for supplier access.
 */
@Module({
  imports: [VendorDashboardModule, VendorProfileModule],
})
export class VendorPortalModule {}
