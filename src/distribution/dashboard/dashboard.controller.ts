import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DistributionDashboardService } from './dashboard.service';
import { ListDashboardQueryDto } from './dto/list-dashboard-query.dto';
import { JwtGuard } from 'src/auth/guard';

@Controller('distribution/dashboard')
@UseGuards(JwtGuard)
export class DistributionDashboardController {
  constructor(private readonly dashboardService: DistributionDashboardService) {}

  @Get()
  getDashboard(@Query() query: ListDashboardQueryDto) {
    return this.dashboardService.getDashboard(query);
  }
}
