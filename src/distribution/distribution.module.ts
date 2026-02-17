import { Module } from '@nestjs/common';
import { ConsignmentModule } from './consignment/consignment.module';
import { DistributionDashboardModule } from './dashboard/dashboard.module';
import { HomepageModule } from './homepage/homepage.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { StockModule } from './stock/stock.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [
    ConsignmentModule,
    DistributionDashboardModule,
    HomepageModule,
    InvoicingModule,
    StockModule,
    UserManagementModule,
  ],
  exports: [
    ConsignmentModule,
    DistributionDashboardModule,
    HomepageModule,
    InvoicingModule,
    StockModule,
    UserManagementModule,
  ],
})
export class DistributionModule {}
