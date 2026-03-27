import { Module } from '@nestjs/common';
import { AvendorPermissionsModule } from './permissions/avendor-permissions.module';
import { AvendorUserModule } from './user/avendor-user.module';

@Module({
  imports: [AvendorPermissionsModule, AvendorUserModule],
  exports: [AvendorPermissionsModule, AvendorUserModule],
})
export class AvendorsModule {}
