import { Module } from '@nestjs/common';
import { AvendorInventoryModule } from './inventory/avendor-inventory.module';
import { AvendorPermissionsModule } from './permissions/avendor-permissions.module';
import { AvendorUserManagementModule } from './user-management/avendor-user-management.module';
import { AvendorUserModule } from './user/avendor-user.module';
import { AvendorVendorsModule } from './vendors/avendor-vendors.module';

@Module({
  imports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
    AvendorVendorsModule,
  ],
  exports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
    AvendorVendorsModule,
  ],
})
export class AvendorsModule {}
