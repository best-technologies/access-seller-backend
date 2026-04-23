import { Module } from '@nestjs/common';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorPermissionsController } from './avendor-permissions.controller';
import { AvendorPermissionsService } from './avendor-permissions.service';

@Module({
  controllers: [AvendorPermissionsController],
  providers: [AvendorPermissionsService, AvendorPlatformGuard],
  exports: [AvendorPermissionsService],
})
export class AvendorPermissionsModule {}
