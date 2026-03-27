import { Module } from '@nestjs/common';
import { AvendorPermissionsModule } from './permissions/avendor-permissions.module';
import { AvendorUserManagementModule } from './user-management/avendor-user-management.module';
import { AvendorUserModule } from './user/avendor-user.module';

@Module({
  imports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
  ],
  exports: [
    AvendorPermissionsModule,
    AvendorUserModule,
    AvendorUserManagementModule,
  ],
})
export class AvendorsModule {}
