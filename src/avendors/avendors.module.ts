import { Module } from '@nestjs/common';
import { AvendorPermissionsModule } from './permissions/avendor-permissions.module';

@Module({
  imports: [AvendorPermissionsModule],
  exports: [AvendorPermissionsModule],
})
export class AvendorsModule {}
