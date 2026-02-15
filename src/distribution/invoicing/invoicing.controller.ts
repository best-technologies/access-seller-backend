import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';

@Controller('distribution/invoicing')
@UseGuards(JwtGuard)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get()
  findAll(@Query() query: ListInvoicesQueryDto) {
    return this.invoicingService.findAll(query);
  }

  @Post()
  create(
    @Body() dto: CreateInvoiceDto,
    @GetUser() user: { id: string },
  ) {
    return this.invoicingService.create(dto, user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicingService.findOne(id);
  }
}
