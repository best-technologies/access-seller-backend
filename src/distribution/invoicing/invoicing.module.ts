import { Module } from '@nestjs/common';
import { InvoicingController } from './invoicing.controller';
import { InvoicingService } from './invoicing.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [InvoicingController],
  providers: [InvoicingService, InvoicePdfService],
  exports: [InvoicingService],
})
export class InvoicingModule {}
