import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { GetVendorContext } from '../decorators/get-vendor-context.decorator';
import type { VendorPortalContext } from '../guards/vendor-portal.guard';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { SetVendorQuotePaymentPlanBodyDto } from 'src/avendors/shared/dto/set-vendor-quote-payment-plan.dto';
import {
  ApiDocGetQuoteRequest,
  ApiDocListPaymentPlans,
  ApiDocListQuoteRequests,
  ApiDocSetPaymentPlan,
  ApiDocSubmitQuote,
  ApiDocWithdrawQuote,
} from './doc';
import { ListVendorQuoteRequestsQueryDto } from './dto/list-quote-requests-query.dto';
import { SubmitVendorQuoteDto } from './dto/submit-quote.dto';
import { VendorQuoteRequestsService } from './vendor-quote-requests.service';

@ApiTags('Vendor Portal — Quote Requests')
@ApiBearerAuth()
@Controller('vendor/quote-requests')
@UseGuards(JwtGuard, VendorPortalGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class VendorQuoteRequestsController {
  constructor(private readonly service: VendorQuoteRequestsService) {}

  @Get()
  @ApiDocListQuoteRequests()
  async list(
    @GetVendorContext() ctx: VendorPortalContext,
    @Query() query: ListVendorQuoteRequestsQueryDto,
  ) {
    return this.service.listQuoteRequests(ctx.vendorId, query);
  }

  @Get('payment-plans')
  @ApiDocListPaymentPlans()
  async listPaymentPlans() {
    return this.service.listActivePaymentPlans();
  }

  @Get(':rfqId')
  @ApiDocGetQuoteRequest()
  async detail(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('rfqId') rfqId: string,
  ) {
    return this.service.getQuoteRequest(ctx.vendorId, rfqId);
  }

  @Post(':rfqId/quote')
  @ApiDocSubmitQuote()
  async submitQuote(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('rfqId') rfqId: string,
    @Body() dto: SubmitVendorQuoteDto,
  ) {
    return this.service.submitQuote(ctx.vendorId, rfqId, dto);
  }

  @Patch(':rfqId/quote/payment-plan')
  @ApiDocSetPaymentPlan()
  async setPaymentPlan(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('rfqId') rfqId: string,
    @Body() dto: SetVendorQuotePaymentPlanBodyDto,
  ) {
    return this.service.setPaymentPlanOnQuote(ctx.vendorId, rfqId, dto);
  }

  @Delete(':rfqId/quote')
  @ApiDocWithdrawQuote()
  async withdrawQuote(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('rfqId') rfqId: string,
  ) {
    return this.service.withdrawQuote(ctx.vendorId, rfqId);
  }
}
