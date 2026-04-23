import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { UpdateVendorCompanyDto } from '../dto/update-company.dto';
import * as colors from 'colors';

@Injectable()
export class VendorProfileCompanyService {
  private readonly logger = new Logger(VendorProfileCompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateCompany(vendorId: string, dto: UpdateVendorCompanyDto) {
    this.logger.log(colors.blue(`Updating company profile for vendor=${vendorId}`));

    const hasChange =
      dto.name !== undefined ||
      dto.industry !== undefined ||
      dto.phone !== undefined ||
      dto.address !== undefined ||
      dto.city !== undefined ||
      dto.country !== undefined;

    if (!hasChange) {
      throw new BadRequestException('Provide at least one company field to update');
    }

    const data: Prisma.AvendorVendorUpdateInput = {};
    if (dto.name !== undefined) {
      if (!dto.name) {
        throw new BadRequestException('Company name cannot be blank');
      }
      data.name = dto.name;
    }
    if (dto.industry !== undefined) data.industry = dto.industry;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;

    const updated = await this.prisma.avendorVendor.update({
      where: { id: vendorId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        industry: true,
        address: true,
        city: true,
        country: true,
        updatedAt: true,
      },
    });

    this.logger.log(colors.green(`Company profile updated for vendor=${vendorId}`));
    return ResponseHelper.success('Company profile updated', updated);
  }
}
