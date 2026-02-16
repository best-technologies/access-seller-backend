import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicingService } from './invoicing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('distribution/invoicing')
@UseGuards(JwtGuard)
export class InvoicingController {
  constructor(
    private readonly invoicingService: InvoicingService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

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

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    await this.invoicePdfService.generatePdf(id, res);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.invoicingService.getPayments(id);
  }

  @Post(':id/payments')
  @UseInterceptors(
    FileInterceptor('receipt', { limits: { fileSize: MAX_RECEIPT_SIZE } }),
  )
  recordPayment(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @UploadedFile() receipt?: Express.Multer.File,
    @GetUser() user?: { id: string },
  ) {
    // Parse form-data (multipart sends all fields as strings)
    const dto: RecordPaymentDto = {
      amount: parseFloat(String(body?.amount ?? 0)) || 0,
      paymentMethod: body?.paymentMethod || undefined,
      reference: body?.reference || undefined,
      notes: body?.notes || undefined,
    };
    return this.invoicingService.recordPayment(id, dto, receipt, user?.id);
  }

  @Patch(':id/mark-paid')
  markAsPaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
  ) {
    return this.invoicingService.markAsPaid(id, dto);
  }

  @Patch(':id/unmark-paid')
  unmarkAsPaid(@Param('id') id: string) {
    return this.invoicingService.unmarkAsPaid(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicingService.update(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicingService.findOne(id);
  }
}
