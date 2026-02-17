import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { EditPermissionsDto } from './dto/edit-permissions.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

const USER_SELECT = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  phone_number: true,
  role: true,
  status: true,
  level: true,
  usertype: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // we are only considering users with usertype: btech-distribution
  async getDashboard() {
    const [recentUsers, totalUsers, activeUsers, suspendedUsers, inactiveUsers, byRole] =
      await Promise.all([
        this.prisma.user.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: USER_SELECT,
          where: { usertype: 'btech-distribution' },
        }),
        this.prisma.user.count({ where: { usertype: 'btech-distribution' } }),
        this.prisma.user.count({ where: { status: 'active', usertype: 'btech-distribution' } }),
        this.prisma.user.count({ where: { status: 'suspended', usertype: 'btech-distribution' } }),
        this.prisma.user.count({ where: { status: 'inactive', usertype: 'btech-distribution' } }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
          where: { usertype: 'btech-distribution' },
        }),
      ]);

    const byLevel = await this.prisma.user.groupBy({
      by: ['level'],
      _count: { id: true },
      where: { usertype: 'btech-distribution' },
    });

    const analysis = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count.id])),
      byLevel: Object.fromEntries(byLevel.map((r) => [r.level, r._count.id])),
    };

    const payload = {
      analysis,
      recentUsers,
    };

    this.logger.log(`Users dashboard | total: ${totalUsers}, recent: ${recentUsers.length}`);
    return ResponseHelper.success('Users dashboard retrieved', payload);
  }

  private buildWhere(query: ListUsersQueryDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }
    if (query.role) {
      where.role = query.role as any;
    }
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.fromCreatedAt || query.toCreatedAt) {
      where.createdAt = {};
      if (query.fromCreatedAt) where.createdAt.gte = new Date(query.fromCreatedAt);
      if (query.toCreatedAt) where.createdAt.lte = new Date(query.toCreatedAt);
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      const searchMode = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { email: searchMode },
        { first_name: searchMode },
        { last_name: searchMode },
        { phone_number: searchMode },
      ];
    }
    return where;
  }

  async findAll(query: ListUsersQueryDto) {
    const page = Math.max(1, typeof query.page === 'number' ? query.page : parseInt(String(query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, typeof query.limit === 'number' ? query.limit : parseInt(String(query.limit), 10) || 20));
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const validSort = ['createdAt', 'email', 'first_name', 'last_name', 'role', 'status'] as const;
    const sortBy = validSort.includes(query.sortBy as any) ? (query.sortBy as (typeof validSort)[number]) : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const orderBy = { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput;

    const [items, total, totalUsers, activeUsers, suspendedUsers, inactiveUsers, byRole] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { ...where, usertype: 'btech-distribution' },
          skip,
          take: limit,
          orderBy,
          select: USER_SELECT,
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'active' } }),
        this.prisma.user.count({ where: { status: 'suspended' } }),
        this.prisma.user.count({ where: { status: 'inactive' } }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
      ]);

    const byLevel = await this.prisma.user.groupBy({
      by: ['level'],
      _count: { id: true },
    });

    const analysis = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count.id])),
      byLevel: Object.fromEntries(byLevel.map((r) => [r.level, r._count.id])),
    };

    const totalPages = Math.ceil(total / limit);
    const payload = {
      analysis,
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    this.logger.log(`Users list | total: ${total}, page: ${page}/${totalPages}`);
    return ResponseHelper.success('Users retrieved', payload);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            description: true,
          },
        },
        Affiliate: {
          select: {
            id: true,
            userName: true,
            userEmail: true,
            status: true,
            requestedAt: true,
            reviewedAt: true,
            category: true,
            reason: true,
            notes: true,
          },
        },
        banks: {
          select: {
            id: true,
            bankName: true,
            bankCode: true,
            accountNumber: true,
            accountName: true,
          },
        },
        shippingAddresses: true,
        wallet: {
          select: {
            id: true,
            total_earned: true,
            available_for_withdrawal: true,
            total_withdrawn: true,
          },
        },
        userPermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                displayName: true,
                category: true,
                description: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            CommissionReferral: true,
            commissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password,
      otp,
      otp_expires_at,
      userPermissions: _up,
      store: _store,
      Affiliate: _aff,
      _count,
      ...profile
    } = user;

    const permissions = user.userPermissions.map((up) => ({
      id: up.permission.id,
      name: up.permission.name,
      displayName: up.permission.displayName,
      category: up.permission.category,
      description: up.permission.description ?? undefined,
      isActive: up.permission.isActive,
      grantedAt: up.grantedAt,
      grantedBy: up.grantedBy ?? undefined,
    }));

    const payload = {
      ...profile,
      legacyPermissions: user.permissions ?? [],
      permissions,
      store: user.store ?? null,
      affiliate: user.Affiliate ?? null,
      banks: user.banks,
      shippingAddresses: user.shippingAddresses,
      wallet: user.wallet ?? null,
      counts: {
        orders: user._count.orders,
        commissionReferrals: user._count.CommissionReferral,
        commissions: user._count.commissions,
      },
    };

    this.logger.log(`User by ID | ${user.email}`);
    return ResponseHelper.success('User retrieved', payload);
  }

  async updateUser(id: string, dto: EditUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Email ${dto.email} is already in use`);
      }
    }

    if (dto.store_id !== undefined && dto.store_id !== null && dto.store_id !== '') {
      const store = await this.prisma.store.findUnique({ where: { id: dto.store_id } });
      if (!store) {
        throw new BadRequestException('Store not found');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.phone_number !== undefined) data.phone_number = dto.phone_number;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.display_picture !== undefined) data.display_picture = dto.display_picture;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.allowedPartialPayment !== undefined) data.allowedPartialPayment = dto.allowedPartialPayment;
    if (dto.usertype !== undefined) data.usertype = dto.usertype;
    if (dto.store_id !== undefined) data.store_id = dto.store_id || null;
    if (dto.permissions !== undefined) data.permissions = dto.permissions;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const result = await this.findOne(id);
    this.logger.log(`User updated | ${updated.email}`);
    return ResponseHelper.success('User updated', result.data);
  }

  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true,
        description: true,
      },
    });

    const categorized: Record<string, Array<{ id: string; name: string; displayName: string; description?: string }>> =
      {};
    for (const p of permissions) {
      if (!categorized[p.category]) categorized[p.category] = [];
      categorized[p.category].push({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description ?? undefined,
      });
    }

    const payload = {
      permissions,
      categorized,
    };
    this.logger.log(`Permissions fetched | total: ${permissions.length}`);
    return ResponseHelper.success('Permissions retrieved', payload);
  }

  async createPermission(dto: CreatePermissionDto) {
    const name = dto.name.trim().toLowerCase();
    const existing = await this.prisma.permission.findUnique({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException(`Permission with name "${name}" already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        name,
        displayName: dto.displayName.trim(),
        category: dto.category.trim(),
        description: dto.description?.trim() ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Permission created | ${permission.name}`);
    return ResponseHelper.created('Permission created', permission);
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim().toLowerCase();
      const existing = await this.prisma.permission.findFirst({
        where: { name, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Permission with name "${name}" already exists`);
      }
      data.name = name;
    }
    if (dto.displayName !== undefined) data.displayName = dto.displayName.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.permission.update({
      where: { id },
      data,
    });

    this.logger.log(`Permission updated | ${updated.name}`);
    return ResponseHelper.success('Permission updated', updated);
  }

  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.permission.delete({ where: { id } });
    this.logger.log(`Permission deleted | ${permission.name}`);
    return ResponseHelper.success('Permission deleted', { id: permission.id, name: permission.name });
  }

  async updatePermissions(id: string, dto: EditPermissionsDto, grantedBy?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uniqueIds = [...new Set(dto.permissionIds)];

    if (uniqueIds.length > 0) {
      const validPermissions = await this.prisma.permission.findMany({
        where: { id: { in: uniqueIds }, isActive: true },
        select: { id: true, name: true },
      });
      const validIds = new Set(validPermissions.map((p) => p.id));
      const invalidIds = uniqueIds.filter((pid) => !validIds.has(pid));
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Invalid or inactive permission IDs: ${invalidIds.join(', ')}`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({ where: { userId: id } }),
      ...(uniqueIds.length > 0
        ? [
            this.prisma.userPermission.createMany({
              data: uniqueIds.map((permissionId) => ({
                userId: id,
                permissionId,
                grantedBy: grantedBy ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const permissionNames =
      uniqueIds.length > 0
        ? (
            await this.prisma.permission.findMany({
              where: { id: { in: uniqueIds } },
              select: { name: true },
            })
          ).map((p) => p.name)
        : [];
    await this.prisma.user.update({
      where: { id },
      data: { permissions: permissionNames },
    });

    const updated = await this.findOne(id);
    this.logger.log(`Permissions updated for user ${id} | count: ${uniqueIds.length}`);
    return ResponseHelper.success('Permissions updated', updated.data);
  }
}
