import { Module } from '@nestjs/common';
import { DistributionDashboardController } from './dashboard.controller';
import { DistributionDashboardService } from './dashboard.service';

@Module({
  controllers: [DistributionDashboardController],
  providers: [DistributionDashboardService],
  exports: [DistributionDashboardService],
})
export class DistributionDashboardModule {}
