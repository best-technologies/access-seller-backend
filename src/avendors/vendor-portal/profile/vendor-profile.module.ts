import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { VendorProfileController } from './vendor-profile.controller';
import { VendorProfileService } from './vendor-profile.service';
import { VendorProfileCompanyService } from './services/vendor-profile-company.service';
import { VendorProfileBankService } from './services/vendor-profile-bank.service';
import { VendorProfileComplianceService } from './services/vendor-profile-compliance.service';
import { VendorProfileSecurityService } from './services/vendor-profile-security.service';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [VendorProfileController],
  providers: [
    VendorPortalGuard,
    VendorProfileService,
    VendorProfileCompanyService,
    VendorProfileBankService,
    VendorProfileComplianceService,
    VendorProfileSecurityService,
  ],
})
export class VendorProfileModule {}
