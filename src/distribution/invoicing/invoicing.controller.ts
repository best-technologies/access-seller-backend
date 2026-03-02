import {
  Body,
  Controller,
  Delete,
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
import { DeliveryNotePdfService } from './delivery-note-pdf.service';
import { InvoicingService } from './invoicing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from './dto/update-delivery-note.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('distribution/invoicing')
@UseGuards(JwtGuard)
export class InvoicingController {
  constructor(
    private readonly invoicingService: InvoicingService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly deliveryNotePdfService: DeliveryNotePdfService,
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

  // Download PDF
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    await this.invoicePdfService.generatePdf(id, res);
  }

  // ===================== DELIVERY NOTES =====================

  @Post(':id/delivery-note')
  createDeliveryNote(
    @Param('id') invoiceId: string,
    @Body() dto: CreateDeliveryNoteDto,
  ) {
    return this.invoicingService.createDeliveryNote(invoiceId, dto);
  }

  @Get(':id/delivery-note')
  getDeliveryNote(@Param('id') invoiceId: string) {
    return this.invoicingService.getDeliveryNoteByInvoiceId(invoiceId);
  }

  @Patch(':id/delivery-note')
  updateDeliveryNote(
    @Param('id') invoiceId: string,
    @Body() dto: UpdateDeliveryNoteDto,
  ) {
    return this.invoicingService.updateDeliveryNote(invoiceId, dto);
  }

  @Delete(':id/delivery-note')
  deleteDeliveryNote(@Param('id') invoiceId: string) {
    return this.invoicingService.deleteDeliveryNote(invoiceId);
  }

  @Get(':id/delivery-note/pdf')
  async downloadDeliveryNotePdf(
    @Param('id') invoiceId: string,
    @Res() res: Response,
  ) {
    await this.deliveryNotePdfService.generatePdf(invoiceId, res);
  }

  // Get payment history
  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.invoicingService.getPayments(id);
  }

  // Record payment
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

  // Mark as paid
  @Patch(':id/mark-paid')
  markAsPaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
  ) {
    return this.invoicingService.markAsPaid(id, dto);
  }

  // Unmark as paid
  @Patch(':id/unmark-paid')
  unmarkAsPaid(@Param('id') id: string) {
    return this.invoicingService.unmarkAsPaid(id);
  }

  // Update invoice
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicingService.update(id, dto);
  }

  // Delete invoice (reverts stock if payments were recorded, removes receipt files)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user?: { id: string; email?: string; first_name?: string; last_name?: string }) {
    return this.invoicingService.delete(id, user);
  }

  // Get invoice by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicingService.findOne(id);
  }
}
