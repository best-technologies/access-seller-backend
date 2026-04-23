import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendorDashboardController } from './vendor-dashboard.controller';
import { VendorDashboardService } from './vendor-dashboard.service';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';

@Module({
  imports: [PrismaModule],
  controllers: [VendorDashboardController],
  providers: [VendorPortalGuard, VendorDashboardService],
})
export class VendorDashboardModule {}
