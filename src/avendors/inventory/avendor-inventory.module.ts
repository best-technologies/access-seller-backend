import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorInventoryController } from './avendor-inventory.controller';
import { AvendorInventoryService } from './avendor-inventory.service';

@Module({
  imports: [SharedModule],
  controllers: [AvendorInventoryController],
  providers: [AvendorInventoryService, AvendorPlatformGuard],
})
export class AvendorInventoryModule {}
