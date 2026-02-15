import { Module } from '@nestjs/common';
import { ConsignmentModule } from './consignment/consignment.module';
import { DistributionDashboardModule } from './dashboard/dashboard.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [ConsignmentModule, DistributionDashboardModule, InvoicingModule, StockModule],
  exports: [ConsignmentModule, DistributionDashboardModule, InvoicingModule, StockModule],
})
export class DistributionModule {}
