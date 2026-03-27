import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ensureBootstrapAvendorPermissionRow } from '../utils/avendor-bootstrap.util';
import {
  AllowedPlatformTypeForAdmin,
  AvendorModuleAccessLevel,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { AVENDOR_PERMISSION_MODULE_META } from '../constants/avendor-permission-modules.constants';
import { CreateAvendorPermissionDto } from './dto/create-avendor-permission.dto';
import { ListAvendorPermissionsQueryDto } from './dto/list-avendor-permissions-query.dto';
import { UpdateAvendorPermissionDto } from './dto/update-avendor-permission.dto';
import * as colors from 'colors';

export type AvendorCaller = { id: string; role: string };

@Injectable()
export class AvendorPermissionsService {
  private readonly logger = new Logger(AvendorPermissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  moduleCatalog() {
    this.logger.log('Serving A-Vendor permission module catalog');
    return ResponseHelper.success('A-Vendor permission modules', {
      modules: [...AVENDOR_PERMISSION_MODULE_META],
      access_levels: [
        AvendorModuleAccessLevel.full_access,
        AvendorModuleAccessLevel.view_only,
        AvendorModuleAccessLevel.no_access,
      ],
    });
  }

  async findMine(callerId: string, callerEmail: string) {
    await ensureBootstrapAvendorPermissionRow(
      this.prisma,
      this.config,
      callerId,
      callerEmail,
    );

    const row = await this.prisma.avendorPermission.findUnique({
      where: { userId: callerId },
      include: {
        user: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(
        'No A-Vendor permission profile for this user yet',
      );
    }
    return ResponseHelper.success('A-Vendor permissions retrieved', this.serialize(row));
  }

  async list(query: ListAvendorPermissionsQueryDto, caller: AvendorCaller) {
    await this.assertCanMutatePermissions(caller);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.search?.trim()
      ? {
          user: {
            email: { contains: query.search.trim(), mode: 'insensitive' as const },
          },
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.avendorPermission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      this.prisma.avendorPermission.count({ where }),
    ]);

    this.logger.log(
      `Listed A-Vendor permissions: page=${page} total=${total}`,
    );

    return ResponseHelper.success(
      'A-Vendor permissions retrieved',
      items.map((r) => this.serialize(r)),
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1,
      },
    );
  }

  async findOne(targetUserId: string, caller: AvendorCaller) {
    await this.assertCanReadUserPermissions(targetUserId, caller);
    const row = await this.prisma.avendorPermission.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(
        'No A-Vendor permission record for this user',
      );
    }
    return ResponseHelper.success(
      'A-Vendor permissions retrieved',
      this.serialize(row),
    );
  }

  async create(dto: CreateAvendorPermissionDto, caller: AvendorCaller) {
    await this.assertCanMutatePermissions(caller);

    const existing = await this.prisma.avendorPermission.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new BadRequestException(
        'An A-Vendor permission record already exists for this user. Use PATCH to update.',
      );
    }

    await this.assertTargetUserHasAvendorPlatform(dto.userId);

    const row = await this.prisma.avendorPermission.create({
      data: {
        userId: dto.userId,
        ...(dto.vendors_management != null && {
          vendors_management: dto.vendors_management,
        }),
        ...(dto.inventory != null && { inventory: dto.inventory }),
        ...(dto.rfqs != null && { rfqs: dto.rfqs }),
        ...(dto.order_management != null && {
          order_management: dto.order_management,
        }),
        ...(dto.invoice != null && { invoice: dto.invoice }),
        ...(dto.payment != null && { payment: dto.payment }),
        ...(dto.onboarding != null && { onboarding: dto.onboarding }),
      },
      include: {
        user: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    this.logger.log(`Created AvendorPermission for userId=${dto.userId}`);
    return ResponseHelper.created(
      'A-Vendor permissions created',
      this.serialize(row),
    );
  }

  async update(
    targetUserId: string,
    dto: UpdateAvendorPermissionDto,
    caller: AvendorCaller,
  ) {
    await this.assertCanMutatePermissions(caller);

    const row = await this.prisma.avendorPermission.findUnique({
      where: { userId: targetUserId },
    });
    if (!row) {
      throw new NotFoundException(
        'No A-Vendor permission record for this user',
      );
    }

    const updated = await this.prisma.avendorPermission.update({
      where: { userId: targetUserId },
      data: {
        ...(dto.vendors_management != null && {
          vendors_management: dto.vendors_management,
        }),
        ...(dto.inventory != null && { inventory: dto.inventory }),
        ...(dto.rfqs != null && { rfqs: dto.rfqs }),
        ...(dto.order_management != null && {
          order_management: dto.order_management,
        }),
        ...(dto.invoice != null && { invoice: dto.invoice }),
        ...(dto.payment != null && { payment: dto.payment }),
        ...(dto.onboarding != null && { onboarding: dto.onboarding }),
      },
      include: {
        user: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    this.logger.log(`Updated AvendorPermission for userId=${targetUserId}`);
    return ResponseHelper.success(
      'A-Vendor permissions updated',
      this.serialize(updated),
    );
  }

  async remove(targetUserId: string, caller: AvendorCaller) {
    await this.assertCanMutatePermissions(caller);

    const row = await this.prisma.avendorPermission.findUnique({
      where: { userId: targetUserId },
    });
    if (!row) {
      throw new NotFoundException(
        'No A-Vendor permission record for this user',
      );
    }

    await this.prisma.avendorPermission.delete({
      where: { userId: targetUserId },
    });

    this.logger.log(`Deleted AvendorPermission for userId=${targetUserId}`);
    return ResponseHelper.success('A-Vendor permissions removed', {
      userId: targetUserId,
    });
  }

  private serialize(row: {
    id: string;
    userId: string;
    vendors_management: AvendorModuleAccessLevel;
    inventory: AvendorModuleAccessLevel;
    rfqs: AvendorModuleAccessLevel;
    order_management: AvendorModuleAccessLevel;
    invoice: AvendorModuleAccessLevel;
    payment: AvendorModuleAccessLevel;
    onboarding: AvendorModuleAccessLevel;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      email: string;
      first_name: string;
      last_name: string;
    };
  }) {
    return {
      id: row.id,
      userId: row.userId,
      user: row.user,
      modules: {
        vendors_management: row.vendors_management,
        inventory: row.inventory,
        rfqs: row.rfqs,
        order_management: row.order_management,
        invoice: row.invoice,
        payment: row.payment,
        onboarding: row.onboarding,
      },
      module_catalog: [...AVENDOR_PERMISSION_MODULE_META],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async assertCanMutatePermissions(caller: AvendorCaller) {
    if (caller.role === 'super_admin') {
      return;
    }
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { onboarding: true },
    });
    if (
      !perm ||
      perm.onboarding !== AvendorModuleAccessLevel.full_access
    ) {
      throw new ForbiddenException(
        'You need full access to the A-Vendor Onboarding module, or super_admin role, to manage permissions.',
      );
    }
  }

  private async assertCanReadUserPermissions(
    targetUserId: string,
    caller: AvendorCaller,
  ) {
    if (caller.role === 'super_admin' || caller.id === targetUserId) {
      return;
    }
    await this.assertCanMutatePermissions(caller);
  }

  private async assertTargetUserHasAvendorPlatform(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { allowedPlatformsForAdmin: true, role: true },
    });
    if (!u) {
      throw new NotFoundException(`No user with id ${userId}`);
    }
    // Global admins can receive an A-Vendor permission row without the platform flag
    // (avendor in allowedPlatformsForAdmin is still required for normal admins).
    if (u.role === 'super_admin') {
      return;
    }
    const platforms = u.allowedPlatformsForAdmin ?? [];
    if (!platforms.includes(AllowedPlatformTypeForAdmin.avendor)) {
      this.logger.warn(
        colors.red(
          `Target user ${userId} does not have A-Vendor in allowedPlatformsForAdmin (check DATABASE_URL matches the DB you edit in Prisma Studio)`,
        ),
      );
      throw new BadRequestException(
        'Target user must have A-Vendor in allowedPlatformsForAdmin before attaching permissions. Use POST /auth/vendor/onboard-vendor-admin for that user, or confirm the API and Studio use the same database.',
      );
    }
  }
}
