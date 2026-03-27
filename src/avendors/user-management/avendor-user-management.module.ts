import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorUserManagementController } from './avendor-user-management.controller';
import { AvendorUserManagementService } from './avendor-user-management.service';

@Module({
  imports: [SharedModule],
  controllers: [AvendorUserManagementController],
  providers: [AvendorUserManagementService, AvendorPlatformGuard],
})
export class AvendorUserManagementModule {}
