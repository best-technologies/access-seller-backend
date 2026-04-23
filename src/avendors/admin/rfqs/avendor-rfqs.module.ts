import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorRfqsController } from './avendor-rfqs.controller';
import { AvendorRfqsService } from './avendor-rfqs.service';

@Module({
  imports: [SharedModule],
  controllers: [AvendorRfqsController],
  providers: [AvendorRfqsService, AvendorPlatformGuard],
})
export class AvendorRfqsModule {}
