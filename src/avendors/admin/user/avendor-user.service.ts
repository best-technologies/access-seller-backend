import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AllowedPlatformTypeForAdmin,
  AvendorModuleAccessLevel,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { mapPrismaPlatformsToApi } from 'src/shared/constants/admin-platform-access.constants';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { AVENDOR_PERMISSION_MODULE_META } from '../../shared/constants/avendor-permission-modules.constants';
import { ensureBootstrapAvendorPermissionRow } from '../../shared/utils/avendor-bootstrap.util';
import * as colors from 'colors';

@Injectable()
export class AvendorUserService {
  private readonly logger = new Logger(AvendorUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getMyProfile(caller: { id: string; email: string }) {
    await ensureBootstrapAvendorPermissionRow(
      this.prisma,
      this.config,
      caller.id,
      caller.email,
    );

    this.logger.warn(colors.blue(`Caller: ${caller.id} ${caller.email}`));

    const user = await this.prisma.user.findUnique({
      where: { id: caller.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        phone_number: true,
        company_position: true,
        display_picture: true,
        role: true,
        status: true,
        is_active: true,
        is_email_verified: true,
        address: true,
        allowedPlatformsForAdmin: true,
        permissions: true,
        password: true,
        guest_password: true,
        createdAt: true,
        updatedAt: true,
        avendorPermission: true,
      },
    });

    if (!user) {
      this.logger.warn(colors.red(`User not found: ${caller.id} ${caller.email}`));
      throw new NotFoundException('User not found');
    }

    const { password, guest_password, avendorPermission, ...rest } = user;

    const data = {
      id: rest.id,
      first_name: rest.first_name,
      last_name: rest.last_name,
      username: rest.username,
      email: rest.email,
      phone_number: rest.phone_number,
      company_position: rest.company_position,
      display_picture: rest.display_picture,
      role: rest.role,
      status: rest.status,
      is_active: rest.is_active,
      is_email_verified: rest.is_email_verified,
      address: rest.address,
      allowed_platforms: mapPrismaPlatformsToApi(rest.allowedPlatformsForAdmin ?? []),
      /** Global Access Seller permission slugs (separate from A-Vendor module matrix). */
      global_permission_slugs: rest.permissions ?? [],
      security: {
        /** Login password is configured (hash is never returned). */
        has_login_password: Boolean(password?.trim()),
        has_guest_password: Boolean(guest_password?.trim()),
      },
      avendor: {
        has_platform_flag:
          rest.allowedPlatformsForAdmin?.includes(
            AllowedPlatformTypeForAdmin.avendor,
          ) ?? false,
        permission_record: avendorPermission
          ? {
              id: avendorPermission.id,
              userId: avendorPermission.userId,
              modules: {
                vendors_management: avendorPermission.vendors_management,
                inventory: avendorPermission.inventory,
                rfqs: avendorPermission.rfqs,
                order_management: avendorPermission.order_management,
                invoice: avendorPermission.invoice,
                payment: avendorPermission.payment,
                onboarding: avendorPermission.onboarding,
              },
              module_catalog: [...AVENDOR_PERMISSION_MODULE_META],
              access_levels: [
                AvendorModuleAccessLevel.full_access,
                AvendorModuleAccessLevel.view_only,
                AvendorModuleAccessLevel.no_access,
              ],
              createdAt: avendorPermission.createdAt,
              updatedAt: avendorPermission.updatedAt,
            }
          : null,
      },
      timestamps: {
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      },
    };

    this.logger.warn(colors.magenta(`A-Vendor user profile retrieved: ${caller.email}`));
    return ResponseHelper.success('A-Vendor user profile retrieved', data);
  }
}
