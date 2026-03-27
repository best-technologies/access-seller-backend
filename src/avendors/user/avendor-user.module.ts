import { Module } from '@nestjs/common';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorUserController } from './avendor-user.controller';
import { AvendorUserService } from './avendor-user.service';

@Module({
  controllers: [AvendorUserController],
  providers: [AvendorUserService, AvendorPlatformGuard],
})
export class AvendorUserModule {}
