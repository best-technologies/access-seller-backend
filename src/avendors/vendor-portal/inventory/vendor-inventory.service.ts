import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { AdjustStockDto, StockAdjustmentAction } from './dto/adjust-stock.dto';
import { CreateVendorInventoryCategoryDto } from './dto/create-category.dto';
import { CreateVendorInventoryMaterialDto } from './dto/create-material.dto';
import {
  ListVendorInventoryCategoriesQueryDto,
} from './dto/list-categories-query.dto';
import {
  ListVendorInventoryMaterialsQueryDto,
  SortOrder,
  VendorInventoryMaterialSortBy,
  VendorInventoryStockStatus,
} from './dto/list-materials-query.dto';
import { UpdateVendorInventoryCategoryDto } from './dto/update-category.dto';
import { UpdateVendorInventoryMaterialDto } from './dto/update-material.dto';

const STORAGE_FOLDER = 'a-vendor/vendor-inventory';
const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const DEFAULT_SKU_PREFIX = 'ITM';
const SKU_PAD_LENGTH = 3;

type MaterialStatus = VendorInventoryStockStatus;

const toStatus = (stock: number, reorderLevel: number): MaterialStatus => {
  if (stock <= 0) return VendorInventoryStockStatus.out_of_stock;
  if (stock <= reorderLevel) return VendorInventoryStockStatus.low_stock;
  return VendorInventoryStockStatus.in_stock;
};

@Injectable()
export class VendorInventoryService {
  private readonly logger = new Logger(VendorInventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─── CATEGORIES ───────────────────────────────────────────

  async createCategory(vendorId: string, dto: CreateVendorInventoryCategoryDto) {
    const name = dto.name.trim();
    this.logger.log(
      colors.blue(`[vendor=${vendorId}] create category name="${name}"`),
    );

    const existing = await this.prisma.avendorVendorInventoryCategory.findFirst({
      where: { vendorId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists`);
    }

    const skuPrefix = dto.skuPrefix
      ? dto.skuPrefix.toUpperCase()
      : this.derivePrefixFromName(name);

    const category = await this.prisma.avendorVendorInventoryCategory.create({
      data: {
        vendorId,
        name,
        description: dto.description?.trim() || null,
        skuPrefix,
      },
      include: { _count: { select: { materials: true } } },
    });

    this.logger.log(
      colors.green(
        `[vendor=${vendorId}] category created id=${category.id} prefix=${category.skuPrefix}`,
      ),
    );

    return ResponseHelper.created('Category created', this.shapeCategory(category));
  }

  async listCategories(
    vendorId: string,
    query: ListVendorInventoryCategoriesQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.AvendorVendorInventoryCategoryWhereInput = {
      vendorId,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.avendorVendorInventoryCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { materials: true } } },
      }),
      this.prisma.avendorVendorInventoryCategory.count({ where }),
    ]);

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] categories retrieved: ${rows.length}/${total}`,
      ),
    );

    return ResponseHelper.success(
      'Categories retrieved',
      rows.map((r) => this.shapeCategory(r)),
      {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + rows.length < total,
        hasPrevPage: page > 1,
      },
    );
  }

  async getCategory(vendorId: string, id: string) {
    const category = await this.findCategoryOrFail(vendorId, id);
    return ResponseHelper.success('Category retrieved', this.shapeCategory(category));
  }

  async updateCategory(
    vendorId: string,
    id: string,
    dto: UpdateVendorInventoryCategoryDto,
  ) {
    const category = await this.findCategoryOrFail(vendorId, id);

    const data: Prisma.AvendorVendorInventoryCategoryUpdateInput = {};

    if (dto.name !== undefined) {
      const nextName = dto.name.trim();
      if (nextName.toLowerCase() !== category.name.toLowerCase()) {
        const conflict =
          await this.prisma.avendorVendorInventoryCategory.findFirst({
            where: {
              vendorId,
              name: { equals: nextName, mode: 'insensitive' },
              NOT: { id },
            },
            select: { id: true },
          });
        if (conflict) {
          throw new ConflictException(`Category "${nextName}" already exists`);
        }
      }
      data.name = nextName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.skuPrefix !== undefined) {
      data.skuPrefix = dto.skuPrefix.toUpperCase();
    }

    const updated = await this.prisma.avendorVendorInventoryCategory.update({
      where: { id },
      data,
      include: { _count: { select: { materials: true } } },
    });

    this.logger.log(
      colors.green(`[vendor=${vendorId}] category updated id=${id}`),
    );

    return ResponseHelper.success('Category updated', this.shapeCategory(updated));
  }

  async deleteCategory(vendorId: string, id: string) {
    const category = await this.findCategoryOrFail(vendorId, id, {
      materials: true,
    });

    if ((category as any)._count?.materials > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" — it still has ${(category as any)._count.materials} material(s). Reassign or remove them first.`,
      );
    }

    await this.prisma.avendorVendorInventoryCategory.delete({ where: { id } });

    this.logger.log(
      colors.yellow(`[vendor=${vendorId}] category deleted id=${id}`),
    );

    return ResponseHelper.success('Category deleted', {
      id: category.id,
      name: category.name,
    });
  }

  // ─── MATERIALS ────────────────────────────────────────────

  async createMaterial(
    vendorId: string,
    dto: CreateVendorInventoryMaterialDto,
    image?: Express.Multer.File,
  ) {
    const name = dto.name.trim();
    this.logger.log(
      colors.blue(`[vendor=${vendorId}] create material name="${name}"`),
    );

    const category = await this.prisma.avendorVendorInventoryCategory.findFirst(
      { where: { id: dto.categoryId, vendorId } },
    );
    if (!category) {
      throw new BadRequestException(
        'Category not found for this vendor. Create the category first.',
      );
    }

    const sku = dto.sku
      ? dto.sku.toUpperCase()
      : await this.generateNextSku(vendorId, category.skuPrefix);

    const skuTaken =
      await this.prisma.avendorVendorInventoryMaterial.findFirst({
        where: { vendorId, sku },
        select: { id: true },
      });
    if (skuTaken) {
      throw new ConflictException(
        `SKU "${sku}" is already used by another material in your inventory`,
      );
    }

    if (image && !IMAGE_MIMES.has(image.mimetype)) {
      throw new BadRequestException('Image must be a JPEG, PNG, or WebP file');
    }

    let uploaded: StorageUploadResult[] = [];
    try {
      let imageUrl: string | null = null;
      let imagePublicId: string | null = null;

      if (image?.buffer?.length) {
        uploaded = await this.storage.upload([image], STORAGE_FOLDER);
        imageUrl = uploaded[0]?.secure_url ?? null;
        imagePublicId = uploaded[0]?.public_id ?? null;
      }

      const material = await this.prisma.avendorVendorInventoryMaterial.create({
        data: {
          vendorId,
          categoryId: category.id,
          sku,
          name,
          unit: dto.unit.trim(),
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
          `[vendor=${vendorId}] material created id=${material.id} sku=${material.sku}`,
        ),
      );

      return ResponseHelper.created('Material created', this.shapeMaterial(material));
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async listMaterials(
    vendorId: string,
    query: ListVendorInventoryMaterialsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const conditions: Prisma.AvendorVendorInventoryMaterialWhereInput[] = [
      { vendorId },
    ];
    if (query.categoryId) conditions.push({ categoryId: query.categoryId });
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.status) {
      conditions.push(await this.stockStatusFilter(vendorId, query.status));
    }

    const where: Prisma.AvendorVendorInventoryMaterialWhereInput = {
      AND: conditions,
    };

    const sortBy = query.sortBy ?? VendorInventoryMaterialSortBy.createdAt;
    const sortOrder = query.sortOrder ?? SortOrder.desc;

    const [rows, total, allForAnalysis, statusCounts, categoriesCount] =
      await Promise.all([
        this.prisma.avendorVendorInventoryMaterial.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: { category: true },
        }),
        this.prisma.avendorVendorInventoryMaterial.count({ where }),
        this.prisma.avendorVendorInventoryMaterial.findMany({
          where: { vendorId },
          select: { stock: true, reorderLevel: true, pricePerUnit: true },
        }),
        this.countStatuses(vendorId),
        this.prisma.avendorVendorInventoryCategory.count({ where: { vendorId } }),
      ]);

    const summary = this.computeSummary(allForAnalysis);

    this.logger.log(
      colors.magenta(
        `[vendor=${vendorId}] materials retrieved ${rows.length}/${total} status=${query.status ?? 'all'}`,
      ),
    );

    return ResponseHelper.success(
      'Materials retrieved',
      {
        summary: {
          totalMaterials: summary.totalMaterials,
          totalCategories: categoriesCount,
          totalStock: summary.totalStock,
          totalInventoryValue: summary.totalInventoryValue,
          totalUnitPriceSum: summary.totalUnitPriceSum,
        },
        statusCounts,
        items: rows.map((r) => this.shapeMaterial(r)),
      },
      {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + rows.length < total,
        hasPrevPage: page > 1,
      },
    );
  }

  async getMaterial(vendorId: string, id: string) {
    const material = await this.findMaterialOrFail(vendorId, id);
    return ResponseHelper.success('Material retrieved', this.shapeMaterial(material));
  }

  async updateMaterial(
    vendorId: string,
    id: string,
    dto: UpdateVendorInventoryMaterialDto,
    image?: Express.Multer.File,
  ) {
    const material = await this.findMaterialOrFail(vendorId, id);

    const hasAnyUpdate =
      dto.name !== undefined ||
      dto.categoryId !== undefined ||
      dto.unit !== undefined ||
      dto.sku !== undefined ||
      dto.description !== undefined ||
      dto.stock !== undefined ||
      dto.reorderLevel !== undefined ||
      dto.pricePerUnit !== undefined ||
      !!image?.buffer?.length;

    if (!hasAnyUpdate) {
      throw new BadRequestException('Provide at least one field or an image to update');
    }

    if (dto.categoryId && dto.categoryId !== material.categoryId) {
      const category =
        await this.prisma.avendorVendorInventoryCategory.findFirst({
          where: { id: dto.categoryId, vendorId },
          select: { id: true },
        });
      if (!category) {
        throw new BadRequestException('Category not found for this vendor');
      }
    }

    if (dto.sku && dto.sku.toUpperCase() !== material.sku) {
      const nextSku = dto.sku.toUpperCase();
      const conflict = await this.prisma.avendorVendorInventoryMaterial.findFirst(
        { where: { vendorId, sku: nextSku, NOT: { id } } },
      );
      if (conflict) {
        throw new ConflictException(`SKU "${nextSku}" is already in use`);
      }
    }

    if (image && !IMAGE_MIMES.has(image.mimetype)) {
      throw new BadRequestException('Image must be a JPEG, PNG, or WebP file');
    }

    let uploaded: StorageUploadResult[] = [];
    try {
      let newImageUrl: string | undefined;
      let newImagePublicId: string | undefined;

      if (image?.buffer?.length) {
        if (material.imagePublicId) {
          try {
            await this.storage.delete([material.imagePublicId]);
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

      const data: Prisma.AvendorVendorInventoryMaterialUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name.trim();
      if (dto.categoryId !== undefined) {
        data.category = { connect: { id: dto.categoryId } };
      }
      if (dto.unit !== undefined) data.unit = dto.unit.trim() || 'pieces';
      if (dto.sku !== undefined) data.sku = dto.sku.toUpperCase();
      if (dto.description !== undefined) {
        data.description = dto.description?.trim() || null;
      }
      if (dto.stock !== undefined) data.stock = dto.stock;
      if (dto.reorderLevel !== undefined) data.reorderLevel = dto.reorderLevel;
      if (dto.pricePerUnit !== undefined) data.pricePerUnit = dto.pricePerUnit;
      if (newImageUrl !== undefined) {
        data.imageUrl = newImageUrl;
        data.imagePublicId = newImagePublicId ?? null;
      }

      const updated = await this.prisma.avendorVendorInventoryMaterial.update({
        where: { id },
        data,
        include: { category: true },
      });

      this.logger.log(colors.green(`[vendor=${vendorId}] material updated id=${id}`));

      return ResponseHelper.success('Material updated', this.shapeMaterial(updated));
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async deleteMaterial(vendorId: string, id: string) {
    const material = await this.findMaterialOrFail(vendorId, id);

    if (material.imagePublicId) {
      try {
        await this.storage.delete([material.imagePublicId]);
      } catch (e) {
        this.logger.warn(
          `Failed to delete material image (${material.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorVendorInventoryMaterial.delete({ where: { id } });

    this.logger.log(colors.yellow(`[vendor=${vendorId}] material deleted id=${id}`));

    return ResponseHelper.success('Material deleted', {
      id: material.id,
      sku: material.sku,
      name: material.name,
    });
  }

  async adjustStock(vendorId: string, id: string, dto: AdjustStockDto) {
    const material = await this.findMaterialOrFail(vendorId, id);

    if (dto.action !== StockAdjustmentAction.set && dto.quantity < 1) {
      throw new BadRequestException(
        `Quantity must be >= 1 for ${dto.action}; use action=set to zero out.`,
      );
    }
    if (dto.action === StockAdjustmentAction.set && dto.quantity < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    let nextStock: number;
    switch (dto.action) {
      case StockAdjustmentAction.increment:
        nextStock = material.stock + dto.quantity;
        break;
      case StockAdjustmentAction.decrement:
        nextStock = material.stock - dto.quantity;
        if (nextStock < 0) {
          throw new BadRequestException(
            `Cannot decrement below zero (current stock is ${material.stock})`,
          );
        }
        break;
      case StockAdjustmentAction.set:
        nextStock = dto.quantity;
        break;
    }

    const updated = await this.prisma.avendorVendorInventoryMaterial.update({
      where: { id },
      data: { stock: nextStock },
      include: { category: true },
    });

    this.logger.log(
      colors.green(
        `[vendor=${vendorId}] stock ${dto.action} material=${id} ${material.stock}->${nextStock}${dto.note ? ` note="${dto.note}"` : ''}`,
      ),
    );

    return ResponseHelper.success('Stock adjusted', this.shapeMaterial(updated));
  }

  // ─── HELPERS ──────────────────────────────────────────────

  private async findCategoryOrFail(
    vendorId: string,
    id: string,
    options?: { materials?: boolean },
  ) {
    const category = await this.prisma.avendorVendorInventoryCategory.findFirst({
      where: { id, vendorId },
      include: options?.materials
        ? { _count: { select: { materials: true } } }
        : undefined,
    });
    if (!category) {
      throw new NotFoundException('Category not found for this vendor');
    }
    return category;
  }

  private async findMaterialOrFail(vendorId: string, id: string) {
    const material = await this.prisma.avendorVendorInventoryMaterial.findFirst({
      where: { id, vendorId },
      include: { category: true },
    });
    if (!material) {
      throw new NotFoundException('Material not found for this vendor');
    }
    return material;
  }

  private derivePrefixFromName(name: string): string {
    const compact = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim();
    if (!compact) return DEFAULT_SKU_PREFIX;

    const words = compact.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const head = words
        .slice(0, 3)
        .map((w) => w[0])
        .join('');
      if (head.length >= 2) return head.slice(0, 4);
    }

    const letters = compact.replace(/\s+/g, '').slice(0, 3);
    return letters.length >= 2 ? letters : DEFAULT_SKU_PREFIX;
  }

  private async generateNextSku(vendorId: string, prefix: string): Promise<string> {
    const pattern = `${prefix}-%`;
    const rows = await this.prisma.avendorVendorInventoryMaterial.findMany({
      where: { vendorId, sku: { startsWith: `${prefix}-` } },
      select: { sku: true },
    });

    let maxSeq = 0;
    for (const row of rows) {
      const match = row.sku.match(/-(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
      }
    }

    const next = String(maxSeq + 1).padStart(SKU_PAD_LENGTH, '0');
    this.logger.log(
      colors.gray(
        `[vendor=${vendorId}] next sku pattern=${pattern} -> ${prefix}-${next}`,
      ),
    );
    return `${prefix}-${next}`;
  }

  private async stockStatusFilter(
    vendorId: string,
    status: MaterialStatus,
  ): Promise<Prisma.AvendorVendorInventoryMaterialWhereInput> {
    if (status === VendorInventoryStockStatus.out_of_stock) {
      return { stock: { lte: 0 } };
    }

    // Both `low_stock` and `in_stock` require comparing `stock` to `reorderLevel`
    // on the same row, which Prisma's standard `where` can't express. We fetch
    // candidate IDs with raw SQL and filter the main query by id IN (...).
    const rows =
      status === VendorInventoryStockStatus.low_stock
        ? await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT "id" FROM "AvendorVendorInventoryMaterial"
            WHERE "vendorId" = ${vendorId}
              AND "stock" > 0
              AND "stock" <= "reorderLevel"
          `)
        : await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT "id" FROM "AvendorVendorInventoryMaterial"
            WHERE "vendorId" = ${vendorId}
              AND "stock" > "reorderLevel"
          `);

    return { id: { in: rows.map((r) => r.id) } };
  }

  private async countStatuses(vendorId: string) {
    const rows = await this.prisma.avendorVendorInventoryMaterial.findMany({
      where: { vendorId },
      select: { stock: true, reorderLevel: true },
    });
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const r of rows) {
      const s = toStatus(r.stock, r.reorderLevel);
      if (s === VendorInventoryStockStatus.in_stock) inStock++;
      else if (s === VendorInventoryStockStatus.low_stock) lowStock++;
      else outOfStock++;
    }
    return { inStock, lowStock, outOfStock };
  }

  private computeSummary(
    rows: Array<{ stock: number; reorderLevel: number; pricePerUnit: number }>,
  ) {
    let totalStock = 0;
    let totalInventoryValue = 0;
    let totalUnitPriceSum = 0;
    for (const r of rows) {
      totalStock += r.stock;
      totalInventoryValue += r.stock * r.pricePerUnit;
      totalUnitPriceSum += r.pricePerUnit;
    }
    return {
      totalMaterials: rows.length,
      totalStock,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalUnitPriceSum: Math.round(totalUnitPriceSum * 100) / 100,
    };
  }

  private shapeCategory(
    row: Prisma.AvendorVendorInventoryCategoryGetPayload<{
      include?: { _count?: { select: { materials: true } } };
    }> & { _count?: { materials: number } },
  ) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      skuPrefix: row.skuPrefix,
      materialsCount: row._count?.materials ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private shapeMaterial(
    row: Prisma.AvendorVendorInventoryMaterialGetPayload<{
      include: { category: true };
    }>,
  ) {
    const status = toStatus(row.stock, row.reorderLevel);
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      description: row.description,
      stock: row.stock,
      reorderLevel: row.reorderLevel,
      pricePerUnit: row.pricePerUnit,
      inventoryValue:
        Math.round(row.stock * row.pricePerUnit * 100) / 100,
      status,
      imageUrl: row.imageUrl,
      category: row.category
        ? {
            id: row.category.id,
            name: row.category.name,
            skuPrefix: row.category.skuPrefix,
          }
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
