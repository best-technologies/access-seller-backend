import { Module } from '@nestjs/common';
import { PublicDepotController } from './depot/depot.controller';
import { DepotService } from '../admin/metadata/depot/depot.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PublicDepotController],
  providers: [DepotService, PrismaService],
  exports: [],
})
export class PublicModule {}
