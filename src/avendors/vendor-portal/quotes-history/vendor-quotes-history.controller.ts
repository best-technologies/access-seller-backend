import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  ApiDocGetFulfillmentTimeline,
  ApiDocGetQuoteHistoryDetail,
  ApiDocListQuotesHistory,
  ApiDocUpdateFulfillmentStage,
} from './doc';
import { ListVendorQuoteHistoryQueryDto } from './dto/list-quotes-history-query.dto';
import { UpdateVendorFulfillmentStageDto } from './dto/update-fulfillment-stage.dto';
import { VendorQuotesHistoryService } from './vendor-quotes-history.service';

@ApiTags('Vendor Portal — Quotes History')
@ApiBearerAuth()
@Controller('vendor/quotes-history')
@UseGuards(JwtGuard, VendorPortalGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class VendorQuotesHistoryController {
  constructor(private readonly service: VendorQuotesHistoryService) {}

  @Get()
  @ApiDocListQuotesHistory()
  async list(
    @GetVendorContext() ctx: VendorPortalContext,
    @Query() query: ListVendorQuoteHistoryQueryDto,
  ) {
    return this.service.listHistory(ctx.vendorId, query);
  }

  @Get(':quoteId')
  @ApiDocGetQuoteHistoryDetail()
  async detail(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('quoteId') quoteId: string,
  ) {
    return this.service.getHistoryDetail(ctx.vendorId, quoteId);
  }

  @Get(':quoteId/fulfillment')
  @ApiDocGetFulfillmentTimeline()
  async fulfillment(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('quoteId') quoteId: string,
  ) {
    return this.service.getFulfillment(ctx.vendorId, quoteId);
  }

  @Patch(':quoteId/fulfillment/stage')
  @ApiDocUpdateFulfillmentStage()
  async updateStage(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('quoteId') quoteId: string,
    @Body() dto: UpdateVendorFulfillmentStageDto,
  ) {
    return this.service.updateFulfillmentStage(ctx.vendorId, quoteId, dto);
  }
}
