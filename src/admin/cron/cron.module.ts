import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule
  ],
  providers: [CronService],
  controllers: [CronController],
  exports: [CronService]
})
export class CronModule {} 