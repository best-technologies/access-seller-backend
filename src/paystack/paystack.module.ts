import { Module } from '@nestjs/common';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { ProductsModule } from '../admin/products/products.module';
import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from 'src/admin/config/config.module';

@Module({
  imports: [ProductsModule, SharedModule, ConfigModule],
  controllers: [PaystackController],
  providers: [PaystackService]
})
export class PaystackModule {}
