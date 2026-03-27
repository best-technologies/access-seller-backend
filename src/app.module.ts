import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import * as joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_UPLOAD_FILE_BYTES } from './shared/constants/upload-limits.constants';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { AdminModule } from './admin/admin.module';
import { PaystackModule } from './paystack/paystack.module';
import { PaystackWebhookModule } from './paystack/webhook/paystack-webhook.module';
import { ProductsModule } from './products/products.module';
import { UserModule } from './user/user.module';
import { DiscountModule } from './discount/discount.module';
import { OrderModule } from './order/order.module';
import { PublicModule } from './public/public.module';
import { DistributionModule } from './distribution/distribution.module';
import { AuditModule } from './shared/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your environment variables file
      load: [appConfig, databaseConfig],
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_FILE_BYTES },
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    SharedModule,
    AdminModule,
    PaystackModule,
    PaystackWebhookModule,
    ProductsModule,
    UserModule,
    DiscountModule,
    OrderModule,
    PublicModule,
    DistributionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
