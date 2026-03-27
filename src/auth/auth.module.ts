import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { SharedModule } from '../shared/shared.module';
import { WarehouseController } from './warehouse/warehouse.controller';
import { WarehouseService } from './warehouse/warehouse.service';
import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [
    SharedModule,
    VendorModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [AuthController, WarehouseController],
  providers: [AuthService, JwtStrategy, WarehouseService],
  exports: [AuthService, WarehouseService]
})
export class AuthModule {}
