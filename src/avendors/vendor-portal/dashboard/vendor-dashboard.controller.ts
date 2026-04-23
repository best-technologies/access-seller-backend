import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { GetVendorContext } from '../decorators/get-vendor-context.decorator';
import type { VendorPortalContext } from '../guards/vendor-portal.guard';
import { VendorDashboardService } from './vendor-dashboard.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-query.dto';
import {
  DashboardErrorResponse,
  DashboardSummaryResponse,
} from './vendor-dashboard.swagger';

@ApiTags('Vendor Portal — Dashboard')
@ApiBearerAuth()
@Controller('vendor/dashboard')
@UseGuards(JwtGuard, VendorPortalGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class VendorDashboardController {
  constructor(private readonly service: VendorDashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Dashboard summary',
    description:
      'Returns KPI cards (active quote requests, accepted quotes, total inventory, total approved payment), the profile-completion banner (percent + missing items keys), the most recent quote requests table, and a greeting block with the supplier company name.',
  })
  @ApiResponse({ status: 200, description: 'Summary retrieved', schema: DashboardSummaryResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: DashboardErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: DashboardErrorResponse })
  async getSummary(
    @GetVendorContext() ctx: VendorPortalContext,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.service.getSummary(ctx.userId, ctx.vendorId, query.recentQuoteLimit);
  }
}
