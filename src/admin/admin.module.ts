import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { CategoryModule } from './metadata/category.module';
import { DepotModule } from './metadata/depot/depot.module';
import { CronModule } from './cron/cron.module';
import { AiBooksModule } from './ai-books/ai-books.module';

@Module({
    imports: [
        DashboardModule,
        ProductsModule,
        OrdersModule,
        CustomersModule,
        ReferralsModule,
        CategoryModule,
        DepotModule,
        CronModule,
        AiBooksModule
    ],
    controllers: [AdminController],
    providers: [AdminService, RolesGuard, Reflector],
    exports: [
        DashboardModule,
        ProductsModule,
        OrdersModule,
        CustomersModule,
        ReferralsModule,
        AiBooksModule
    ]
})
export class AdminModule {}
