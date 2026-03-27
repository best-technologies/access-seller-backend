import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AllowedPlatformTypeForAdmin,
  AvendorModuleAccessLevel,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  mapApiPlatformsToPrisma,
  mapPrismaPlatformsToApi,
} from 'src/shared/constants/admin-platform-access.constants';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { extractStoragePublicIdFromUrl } from 'src/shared/utils/storage-url.util';
import { ensureUsernameAvailable } from 'src/shared/utils/username.util';
import {
  A_VENDOR_DISPLAY_PIC_BASENAME_PREFIX,
  A_VENDOR_USER_STORAGE_FOLDER,
} from 'src/auth/vendor/constants/a-vendor-storage.constants';
import { ListAvendorUsersQueryDto } from './dto/list-avendor-users-query.dto';
import { UpdateAvendorUserByAdminDto } from './dto/update-avendor-user-by-admin.dto';
import * as colors from 'colors';

export type AvendorUserManagementCaller = { id: string; role: string };

const DISPLAY_PIC_MIMES = new Set(['image/jpeg', 'image/png']);

@Injectable()
export class AvendorUserManagementService {
  private readonly logger = new Logger(AvendorUserManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listUsers(query: ListAvendorUsersQueryDto, caller: AvendorUserManagementCaller) {
    this.logger.log(colors.blue('Fetching all A-Vendor users'));
    await this.assertCanListAvendorUsers(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const avendorOnUser = {
      allowedPlatformsForUser: { has: AllowedPlatformTypeForAdmin.avendor },
    };
    const avendorOnAdmin = {
      allowedPlatformsForAdmin: { has: AllowedPlatformTypeForAdmin.avendor },
    };

    const where: Prisma.UserWhereInput = {
      AND: [
        { OR: [avendorOnUser, avendorOnAdmin] },
        ...(query.is_a_vendor !== undefined
          ? [{ is_a_vendor: query.is_a_vendor }]
          : []),
        ...(query.role !== undefined ? [{ role: query.role }] : []),
        ...(search
          ? [
              {
                OR: [
                  { email: { contains: search, mode: 'insensitive' as const } },
                  { first_name: { contains: search, mode: 'insensitive' as const } },
                  { last_name: { contains: search, mode: 'insensitive' as const } },
                  { username: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          username: true,
          phone_number: true,
          display_picture: true,
          company_position: true,
          role: true,
          status: true,
          is_active: true,
          usertype: true,
          is_a_vendor: true,
          allowedPlatformsForAdmin: true,
          allowedPlatformsForUser: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    this.logger.log(
      `Listed A-Vendor users: page=${page} total=${total} search=${search ?? 'none'} is_a_vendor=${query.is_a_vendor ?? 'any'} role=${query.role ?? 'any'}`,
    );

    const items = rows.map((u) => this.toListItem(u));

    this.logger.log(colors.magenta(`A-Vendor users retrieved: ${items.length}`));

    return ResponseHelper.success('A-Vendor users retrieved', items, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + rows.length < total,
      hasPrevPage: page > 1,
    });
  }

  /**
   * Staff A-Vendor admins: `role` admin, not flagged as vendor org (`is_a_vendor` false),
   * with `avendor` on `allowedPlatformsForAdmin`.
   */
  async listAvendorAdmins(
    query: ListAvendorUsersQueryDto,
    caller: AvendorUserManagementCaller,
  ) {
    this.logger.log(colors.blue('Fetching A-Vendor admin staff (role admin, is_a_vendor false)'));
    await this.assertCanListAvendorUsers(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = {
      role: UserRole.admin,
      is_a_vendor: false,
      allowedPlatformsForAdmin: { has: AllowedPlatformTypeForAdmin.avendor },
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { email: { contains: search, mode: 'insensitive' as const } },
                  { first_name: { contains: search, mode: 'insensitive' as const } },
                  { last_name: { contains: search, mode: 'insensitive' as const } },
                  { username: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          username: true,
          phone_number: true,
          display_picture: true,
          company_position: true,
          is_a_vendor: true,
          role: true,
          status: true,
          is_active: true,
          usertype: true,
          allowedPlatformsForAdmin: true,
          allowedPlatformsForUser: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    this.logger.log(
      `Listed A-Vendor admins: page=${page} total=${total} search=${search ?? 'none'}`,
    );

    const items = rows.map((u) => this.toListItem(u));

    return ResponseHelper.success('A-Vendor admins retrieved', items, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + rows.length < total,
      hasPrevPage: page > 1,
    });
  }

  async updateUserByAdmin(
    targetUserId: string,
    dto: UpdateAvendorUserByAdminDto,
    displayPicture: Express.Multer.File | undefined,
    caller: AvendorUserManagementCaller,
  ) {
    await this.assertCanEditAvendorUsers(caller);

    const hasBodyUpdate =
      dto.first_name !== undefined ||
      dto.last_name !== undefined ||
      dto.email !== undefined ||
      dto.phone_number !== undefined ||
      dto.username !== undefined ||
      dto.role !== undefined ||
      dto.status !== undefined ||
      dto.allowed_platforms !== undefined ||
      dto.allowed_platforms_for_user !== undefined;

    if (!hasBodyUpdate && !displayPicture?.buffer?.length) {
      throw new BadRequestException('Provide at least one field or a display_picture file to update');
    }

    if (
      dto.role === UserRole.super_admin &&
      caller.role !== 'super_admin'
    ) {
      throw new ForbiddenException('Only super_admin can assign the super_admin role');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        username: true,
        phone_number: true,
        display_picture: true,
        company_position: true,
        is_a_vendor: true,
        role: true,
        status: true,
        is_active: true,
        usertype: true,
        allowedPlatformsForAdmin: true,
        allowedPlatformsForUser: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (!this.userIsOnAvendorPlatform(target)) {
      throw new BadRequestException(
        'This user is not associated with A-Vendor (missing avendor on user or admin platform lists).',
      );
    }

    const emailNext =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    if (emailNext && emailNext !== target.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: emailNext },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException('Email is already in use');
      }
    }

    await ensureUsernameAvailable(this.prisma, dto.username, targetUserId);

    let uploaded: StorageUploadResult[] = [];
    let newDisplayUrl: string | undefined;
    try {
      if (displayPicture?.buffer?.length) {
        if (!DISPLAY_PIC_MIMES.has(displayPicture.mimetype)) {
          throw new BadRequestException(
            'Display picture must be a JPEG or PNG image',
          );
        }
        await this.removeStoredAssetIfPossible(target.display_picture);
        const results = await this.storage.upload(
          [displayPicture],
          A_VENDOR_USER_STORAGE_FOLDER,
          { basenamePrefix: A_VENDOR_DISPLAY_PIC_BASENAME_PREFIX },
        );
        uploaded = results;
        newDisplayUrl = results[0]?.secure_url;
      }

      const data: Prisma.UserUpdateInput = {};
      if (dto.first_name !== undefined) data.first_name = dto.first_name;
      if (dto.last_name !== undefined) data.last_name = dto.last_name;
      if (emailNext !== undefined) data.email = emailNext;
      if (dto.phone_number !== undefined) {
        data.phone_number = dto.phone_number.trim()
          ? dto.phone_number.trim()
          : null;
      }
      if (dto.username !== undefined) data.username = dto.username;
      if (dto.role !== undefined) data.role = dto.role;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.allowed_platforms !== undefined) {
        data.allowedPlatformsForAdmin = [
          ...new Set(mapApiPlatformsToPrisma(dto.allowed_platforms)),
        ];
      }
      if (dto.allowed_platforms_for_user !== undefined) {
        data.allowedPlatformsForUser = [
          ...new Set(mapApiPlatformsToPrisma(dto.allowed_platforms_for_user)),
        ];
      }
      if (newDisplayUrl !== undefined) {
        data.display_picture = newDisplayUrl;
      }

      const updated = await this.prisma.user.update({
        where: { id: targetUserId },
        data,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          username: true,
          phone_number: true,
          display_picture: true,
          company_position: true,
          is_a_vendor: true,
          role: true,
          status: true,
          is_active: true,
          usertype: true,
          allowedPlatformsForAdmin: true,
          allowedPlatformsForUser: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `A-Vendor user updated by admin: target=${targetUserId} caller=${caller.id}`,
      );

      return ResponseHelper.success('User updated', this.toListItem(updated));
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  private toListItem(u: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string | null;
    phone_number: string | null;
    display_picture: string | null;
    company_position: string | null;
    is_a_vendor: boolean;
    role: UserRole;
    status: UserStatus;
    is_active: boolean;
    usertype: string | null;
    allowedPlatformsForAdmin: AllowedPlatformTypeForAdmin[];
    allowedPlatformsForUser: AllowedPlatformTypeForAdmin[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      phone_number: u.phone_number,
      display_picture: u.display_picture,
      company_position: u.company_position,
      is_a_vendor: u.is_a_vendor,
      role: u.role,
      status: u.status,
      is_active: u.is_active,
      usertype: u.usertype,
      allowed_platforms: mapPrismaPlatformsToApi(u.allowedPlatformsForAdmin ?? []),
      allowed_platforms_for_user: mapPrismaPlatformsToApi(
        u.allowedPlatformsForUser ?? [],
      ),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  private userIsOnAvendorPlatform(u: {
    allowedPlatformsForAdmin: AllowedPlatformTypeForAdmin[];
    allowedPlatformsForUser: AllowedPlatformTypeForAdmin[];
  }): boolean {
    const admin = u.allowedPlatformsForAdmin ?? [];
    const userPl = u.allowedPlatformsForUser ?? [];
    return (
      admin.includes(AllowedPlatformTypeForAdmin.avendor) ||
      userPl.includes(AllowedPlatformTypeForAdmin.avendor)
    );
  }

  private async removeStoredAssetIfPossible(url: string | null): Promise<void> {
    const id = extractStoragePublicIdFromUrl(url);
    if (!id) {
      this.logger.warn(
        'Could not derive storage id from previous display_picture URL; skipping delete',
      );
      return;
    }
    try {
      await this.storage.delete([id]);
      this.logger.log(`Removed previous display picture from storage: ${id}`);
    } catch (e) {
      this.logger.warn(
        `Failed to delete previous display picture (${id}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async assertCanListAvendorUsers(caller: AvendorUserManagementCaller) {
    if (caller.role === 'super_admin') {
      return;
    }
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { vendors_management: true },
    });
    if (
      !perm ||
      perm.vendors_management === AvendorModuleAccessLevel.no_access
    ) {
      throw new ForbiddenException(
        'You need at least view access to A-Vendor Vendors management, or super_admin, to list users.',
      );
    }
  }

  private async assertCanEditAvendorUsers(caller: AvendorUserManagementCaller) {
    if (caller.role === 'super_admin') {
      return;
    }
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { vendors_management: true },
    });
    if (
      !perm ||
      perm.vendors_management !== AvendorModuleAccessLevel.full_access
    ) {
      throw new ForbiddenException(
        'You need full access to A-Vendor Vendors management, or super_admin, to edit users.',
      );
    }
  }
}
