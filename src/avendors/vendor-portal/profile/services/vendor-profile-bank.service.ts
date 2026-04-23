import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { UpsertVendorPortalBankDto } from '../dto/upsert-bank.dto';
import * as colors from 'colors';

@Injectable()
export class VendorProfileBankService {
  private readonly logger = new Logger(VendorProfileBankService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertBank(vendorId: string, dto: UpsertVendorPortalBankDto) {
    this.logger.log(colors.blue(`Upserting bank details for vendor=${vendorId}`));

    const bank = await this.prisma.avendorVendorBank.upsert({
      where: { vendorId },
      update: {
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
      },
      create: {
        vendorId,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
      },
    });

    this.logger.log(colors.green(`Bank details saved for vendor=${vendorId}`));
    return ResponseHelper.success('Bank details saved', bank);
  }

  async deleteBank(vendorId: string) {
    this.logger.log(colors.blue(`Deleting bank details for vendor=${vendorId}`));

    const existing = await this.prisma.avendorVendorBank.findUnique({
      where: { vendorId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('No bank details on file to delete');
    }

    await this.prisma.avendorVendorBank.delete({ where: { vendorId } });

    this.logger.log(colors.yellow(`Bank details removed for vendor=${vendorId}`));
    return ResponseHelper.success('Bank details removed', { vendorId });
  }
}
