import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { SetVendorQuotePaymentPlanBodyDto } from 'src/avendors/shared/dto/set-vendor-quote-payment-plan.dto';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorPaymentPlansService } from './avendor-payment-plans.service';

/**
 * A-Vendor: set the preferred `AvendorPaymentPlan` on a supplier quote
 * (independent of the supplier; `paymentPlanSetBy` = `admin` in the DB).
 */
@ApiTags('A-Vendor — Vendor quotes')
@ApiBearerAuth()
@Controller('avendor/vendor-quotes')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AvendorVendorQuotesController {
  constructor(private readonly service: AvendorPaymentPlansService) {}

  @Patch(':quoteId/payment-plan')
  async setPaymentPlan(
    @GetUser() user: { id: string; role: string },
    @Param('quoteId') quoteId: string,
    @Body() dto: SetVendorQuotePaymentPlanBodyDto,
  ) {
    return this.service.setPaymentPlanOnQuote(quoteId, dto, {
      id: user.id,
      role: user.role,
    });
  }
}
