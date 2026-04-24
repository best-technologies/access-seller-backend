import { Module } from '@nestjs/common';
import { AvendorInventoryModule } from './admin/inventory/avendor-inventory.module';
import { AvendorPaymentPlansModule } from './admin/payment-plans/avendor-payment-plans.module';
import { AvendorPermissionsModule } from './admin/permissions/avendor-permissions.module';
import { AvendorRfqsModule } from './admin/rfqs/avendor-rfqs.module';
import { AvendorUserManagementModule } from './admin/user-management/avendor-user-management.module';
import { AvendorUserModule } from './admin/user/avendor-user.module';
import { AvendorVendorsModule } from './admin/vendors/avendor-vendors.module';
import { VendorPortalModule } from './vendor-portal/vendor-portal.module';

@Module({
  imports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
    AvendorVendorsModule,
    AvendorRfqsModule,
    AvendorPaymentPlansModule,
    VendorPortalModule,
  ],
  exports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
    AvendorVendorsModule,
    AvendorRfqsModule,
    AvendorPaymentPlansModule,
    VendorPortalModule,
  ],
})
export class AvendorsModule {}
