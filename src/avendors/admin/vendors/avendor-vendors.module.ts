import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorVendorsController } from './avendor-vendors.controller';
import { AvendorVendorsService } from './avendor-vendors.service';

@Module({
  imports: [SharedModule],
  controllers: [AvendorVendorsController],
  providers: [AvendorVendorsService, AvendorPlatformGuard],
})
export class AvendorVendorsModule {}
