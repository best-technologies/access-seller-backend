import { Module } from '@nestjs/common';
import { AvendorInventoryModule } from './inventory/avendor-inventory.module';
import { AvendorPermissionsModule } from './permissions/avendor-permissions.module';
import { AvendorUserManagementModule } from './user-management/avendor-user-management.module';
import { AvendorUserModule } from './user/avendor-user.module';

@Module({
  imports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
  ],
  exports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
    AvendorInventoryModule,
  ],
})
export class AvendorsModule {}
