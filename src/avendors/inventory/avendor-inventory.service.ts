import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AvendorModuleAccessLevel, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials-query.dto';
import * as colors from 'colors';

export type AvendorInventoryCaller = { id: string; role: string };

const STORAGE_FOLDER = 'a-vendor/inventory';
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class AvendorInventoryService {
  private readonly logger = new Logger(AvendorInventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─── CATEGORIES ───────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue('Creating inventory category'));
    await this.assertCanEditInventory(caller);

    const normalized = dto.name.trim();
    const existing = await this.prisma.avendorMaterialCategory.findUnique({
      where: { name: normalized },
    });
    if (existing) {
      throw new ConflictException(`Category "${normalized}" already exists`);
    }

    const category = await this.prisma.avendorMaterialCategory.create({
      data: {
        name: normalized,
        description: dto.description?.trim() || null,
      },
    });

    this.logger.log(
      colors.green(`Category created: id=${category.id} name="${category.name}" by=${caller.id}`),
    );

    return ResponseHelper.created('Category created', category);
  }

  async listCategories(query: ListCategoriesQueryDto, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue('Listing inventory categories'));
    await this.assertCanViewInventory(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.AvendorMaterialCategoryWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.avendorMaterialCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { materials: true } } },
      }),
      this.prisma.avendorMaterialCategory.count({ where }),
    ]);

    this.logger.log(
      colors.magenta(`Categories retrieved: ${rows.length} of ${total}, page=${page}`),
    );

    return ResponseHelper.success('Categories retrieved', rows, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + rows.length < total,
      hasPrevPage: page > 1,
    });
  }

  async getCategory(id: string, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue(`Fetching category id=${id}`));
    await this.assertCanViewInventory(caller);

    const category = await this.prisma.avendorMaterialCategory.findUnique({
      where: { id },
      include: { _count: { select: { materials: true } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.logger.log(colors.magenta(`Category retrieved: "${category.name}"`));
    return ResponseHelper.success('Category retrieved', category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue(`Updating category id=${id}`));
    await this.assertCanEditInventory(caller);

    const category = await this.prisma.avendorMaterialCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) {
      const normalized = dto.name.trim();
      if (normalized !== category.name) {
        const conflict = await this.prisma.avendorMaterialCategory.findUnique({
          where: { name: normalized },
        });
        if (conflict) {
          throw new ConflictException(`Category "${normalized}" already exists`);
        }
      }
    }

    const updated = await this.prisma.avendorMaterialCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
      },
      include: { _count: { select: { materials: true } } },
    });

    this.logger.log(
      colors.green(`Category updated: id=${id} name="${updated.name}" by=${caller.id}`),
    );

    return ResponseHelper.success('Category updated', updated);
  }

  async deleteCategory(id: string, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue(`Deleting category id=${id}`));
    await this.assertCanEditInventory(caller);

    const category = await this.prisma.avendorMaterialCategory.findUnique({
      where: { id },
      include: { _count: { select: { materials: true } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.materials > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" — it still has ${category._count.materials} material(s). Remove or reassign them first.`,
      );
    }

    await this.prisma.avendorMaterialCategory.delete({ where: { id } });

    this.logger.log(
      colors.yellow(`Category deleted: id=${id} name="${category.name}" by=${caller.id}`),
    );

    return ResponseHelper.success('Category deleted', {
      id: category.id,
      name: category.name,
    });
  }

  // ─── MATERIALS ────────────────────────────────────────────

  async createMaterial(
    dto: CreateMaterialDto,
    image: Express.Multer.File | undefined,
    caller: AvendorInventoryCaller,
  ) {
    this.logger.log(colors.blue(`Creating material name="${dto.name}"`));
    await this.assertCanEditInventory(caller);

    const category = await this.prisma.avendorMaterialCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;
    let uploaded: StorageUploadResult[] = [];

    try {
      if (image?.buffer?.length) {
        if (!IMAGE_MIMES.has(image.mimetype)) {
          throw new BadRequestException('Image must be a JPEG, PNG, or WebP file');
        }
        uploaded = await this.storage.upload([image], STORAGE_FOLDER);
        imageUrl = uploaded[0]?.secure_url ?? null;
        imagePublicId = uploaded[0]?.public_id ?? null;
      }

      const material = await this.prisma.avendorMaterial.create({
        data: {
          name: dto.name.trim(),
          categoryId: dto.categoryId,
          unit: dto.unit?.trim() || 'pieces',
          description: dto.description?.trim() || null,
          stock: dto.stock ?? 0,
          reorderLevel: dto.reorderLevel ?? 10,
          pricePerUnit: dto.pricePerUnit ?? 0,
          imageUrl,
          imagePublicId,
        },
        include: { category: true },
      });

      this.logger.log(
        colors.green(
          `Material created: id=${material.id} name="${material.name}" category="${category.name}" by=${caller.id}`,
        ),
      );

      return ResponseHelper.created('Material created', material);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async listMaterials(query: ListMaterialsQueryDto, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue('Listing inventory materials'));
    await this.assertCanViewInventory(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const validSort = ['createdAt', 'name', 'stock', 'pricePerUnit'] as const;
    const sortBy = validSort.includes(query.sortBy as any)
      ? (query.sortBy as (typeof validSort)[number])
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const conditions: Prisma.AvendorMaterialWhereInput[] = [];

    if (query.categoryId) {
      conditions.push({ categoryId: query.categoryId });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.AvendorMaterialWhereInput = conditions.length
      ? { AND: conditions }
      : {};

    const [rows, total, allForAnalysis] = await Promise.all([
      this.prisma.avendorMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { category: true },
      }),
      this.prisma.avendorMaterial.count({ where }),
      this.prisma.avendorMaterial.findMany({
        select: {
          stock: true,
          reorderLevel: true,
          pricePerUnit: true,
        },
      }),
    ]);

    const analysis = this.computeAnalysis(allForAnalysis);

    this.logger.log(
      colors.magenta(`Materials retrieved: ${rows.length} of ${total}, page=${page}`),
    );

    return ResponseHelper.success('Materials retrieved', {
      analysis,
      items: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + rows.length < total,
        hasPrevPage: page > 1,
      },
    });
  }

  async getMaterial(id: string, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue(`Fetching material id=${id}`));
    await this.assertCanViewInventory(caller);

    const material = await this.prisma.avendorMaterial.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    this.logger.log(colors.magenta(`Material retrieved: "${material.name}"`));
    return ResponseHelper.success('Material retrieved', material);
  }

  async updateMaterial(
    id: string,
    dto: UpdateMaterialDto,
    image: Express.Multer.File | undefined,
    caller: AvendorInventoryCaller,
  ) {
    this.logger.log(colors.blue(`Updating material id=${id}`));
    await this.assertCanEditInventory(caller);

    const hasBodyUpdate =
      dto.name !== undefined ||
      dto.categoryId !== undefined ||
      dto.unit !== undefined ||
      dto.description !== undefined ||
      dto.stock !== undefined ||
      dto.reorderLevel !== undefined ||
      dto.pricePerUnit !== undefined;

    if (!hasBodyUpdate && !image?.buffer?.length) {
      throw new BadRequestException('Provide at least one field or an image to update');
    }

    const material = await this.prisma.avendorMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.avendorMaterialCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    let newImageUrl: string | undefined;
    let newImagePublicId: string | undefined;
    let uploaded: StorageUploadResult[] = [];

    try {
      if (image?.buffer?.length) {
        if (!IMAGE_MIMES.has(image.mimetype)) {
          throw new BadRequestException('Image must be a JPEG, PNG, or WebP file');
        }
        if (material.imagePublicId) {
          try {
            await this.storage.delete([material.imagePublicId]);
            this.logger.log(`Removed previous image: ${material.imagePublicId}`);
          } catch (e) {
            this.logger.warn(
              `Failed to delete previous image (${material.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        uploaded = await this.storage.upload([image], STORAGE_FOLDER);
        newImageUrl = uploaded[0]?.secure_url;
        newImagePublicId = uploaded[0]?.public_id;
      }

      const data: Prisma.AvendorMaterialUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name.trim();
      if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
      if (dto.unit !== undefined) data.unit = dto.unit.trim() || 'pieces';
      if (dto.description !== undefined) data.description = dto.description?.trim() || null;
      if (dto.stock !== undefined) data.stock = dto.stock;
      if (dto.reorderLevel !== undefined) data.reorderLevel = dto.reorderLevel;
      if (dto.pricePerUnit !== undefined) data.pricePerUnit = dto.pricePerUnit;
      if (newImageUrl !== undefined) {
        data.imageUrl = newImageUrl;
        data.imagePublicId = newImagePublicId ?? null;
      }

      const updated = await this.prisma.avendorMaterial.update({
        where: { id },
        data,
        include: { category: true },
      });

      this.logger.log(
        colors.green(`Material updated: id=${id} name="${updated.name}" by=${caller.id}`),
      );

      return ResponseHelper.success('Material updated', updated);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async deleteMaterial(id: string, caller: AvendorInventoryCaller) {
    this.logger.log(colors.blue(`Deleting material id=${id}`));
    await this.assertCanEditInventory(caller);

    const material = await this.prisma.avendorMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (material.imagePublicId) {
      try {
        await this.storage.delete([material.imagePublicId]);
        this.logger.log(`Removed image from storage: ${material.imagePublicId}`);
      } catch (e) {
        this.logger.warn(
          `Failed to delete image (${material.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorMaterial.delete({ where: { id } });

    this.logger.log(
      colors.yellow(`Material deleted: id=${id} name="${material.name}" by=${caller.id}`),
    );

    return ResponseHelper.success('Material deleted', {
      id: material.id,
      name: material.name,
    });
  }

  // ─── ANALYSIS ─────────────────────────────────────────────

  private computeAnalysis(
    materials: Array<{ stock: number; reorderLevel: number; pricePerUnit: number }>,
  ) {
    let inventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const m of materials) {
      inventoryValue += m.stock * m.pricePerUnit;
      if (m.stock === 0) {
        outOfStockCount++;
      } else if (m.stock <= m.reorderLevel) {
        lowStockCount++;
      }
    }

    return {
      totalMaterials: materials.length,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
    };
  }

  // ─── AUTHORIZATION ────────────────────────────────────────

  private async assertCanViewInventory(caller: AvendorInventoryCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { inventory: true },
    });
    if (!perm || perm.inventory === AvendorModuleAccessLevel.no_access) {
      throw new ForbiddenException(
        'You need at least view access to A-Vendor Inventory to perform this action.',
      );
    }
  }

  private async assertCanEditInventory(caller: AvendorInventoryCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { inventory: true },
    });
    if (!perm || perm.inventory !== AvendorModuleAccessLevel.full_access) {
      throw new ForbiddenException(
        'You need full access to A-Vendor Inventory to perform this action.',
      );
    }
  }
}
