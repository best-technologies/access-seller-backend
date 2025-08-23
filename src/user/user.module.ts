import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedModule } from '../shared/shared.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SharedModule, PrismaModule],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
