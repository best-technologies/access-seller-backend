import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { CommissionReferralConfigService } from './commission.referral.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController],
  providers: [CommissionReferralConfigService],
  exports: [CommissionReferralConfigService],
})
export class ConfigModule {}

