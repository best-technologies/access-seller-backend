import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  imports: [SharedModule],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
