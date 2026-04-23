import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { VendorInventoryController } from './vendor-inventory.controller';
import { VendorInventoryService } from './vendor-inventory.service';

/**
 * Supplier-facing inventory module (`/vendor/inventory/*`).
 * Allows each linked vendor to manage their own categories and materials,
 * including stock levels, reorder thresholds, unit prices and images.
 */
@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [VendorInventoryController],
  providers: [VendorPortalGuard, VendorInventoryService],
})
export class VendorInventoryModule {}
