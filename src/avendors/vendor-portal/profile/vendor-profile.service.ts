import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { computeProfileCompletion } from './vendor-profile-completion.constants';
import * as colors from 'colors';

@Injectable()
export class VendorProfileService {
  private readonly logger = new Logger(VendorProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string, vendorId: string) {
    this.logger.log(colors.blue(`Building vendor profile aggregate user=${userId} vendor=${vendorId}`));

    const [vendor, user] = await Promise.all([
      this.prisma.avendorVendor.findUnique({
        where: { id: vendorId },
        include: {
          bankDetail: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          display_picture: true,
          company_position: true,
          password: true,
        },
      }),
    ]);

    if (!vendor) throw new NotFoundException('Supplier record not found');
    if (!user) throw new NotFoundException('User not found');

    const completion = computeProfileCompletion({
      vendor: {
        name: vendor.name,
        industry: vendor.industry,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        country: vendor.country,
      },
      hasBank: !!vendor.bankDetail,
      documents: vendor.documents.map((d) => ({
        status: d.status,
        expiresAt: d.expiresAt,
      })),
      userEmail: user.email,
    });

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone_number,
        displayPicture: user.display_picture,
        companyPosition: user.company_position,
      },
      company: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        industry: vendor.industry,
        address: vendor.address,
        city: vendor.city,
        country: vendor.country,
        status: vendor.status,
        complianceStatus: vendor.complianceStatus,
        rating: vendor.rating,
        totalOrders: vendor.totalOrders,
        totalSpend: vendor.totalSpend,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      },
      bank: vendor.bankDetail
        ? {
            id: vendor.bankDetail.id,
            bankName: vendor.bankDetail.bankName,
            accountNumber: vendor.bankDetail.accountNumber,
            accountName: vendor.bankDetail.accountName,
            createdAt: vendor.bankDetail.createdAt,
            updatedAt: vendor.bankDetail.updatedAt,
          }
        : null,
      compliance: {
        status: vendor.complianceStatus,
        documents: vendor.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          label: d.label,
          imageUrl: d.imageUrl,
          status: d.status,
          expiresAt: d.expiresAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      },
      security: {
        hasPassword: !!user.password,
      },
      profileCompletion: completion,
    };

    return ResponseHelper.success('Vendor profile retrieved', payload);
  }
}
