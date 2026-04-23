import { Module } from '@nestjs/common';
import { VendorDashboardModule } from './dashboard/vendor-dashboard.module';
import { VendorProfileModule } from './profile/vendor-profile.module';

/**
 * Root module for the supplier-facing vendor portal. Sibling to the admin
 * `AvendorsModule`; shares Prisma models but has its own guard so admin and
 * supplier access checks stay cleanly separated.
 */
@Module({
  imports: [VendorDashboardModule, VendorProfileModule],
})
export class VendorPortalModule {}
