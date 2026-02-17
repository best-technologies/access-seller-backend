import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService, CloudinaryUploadResult } from 'src/shared/services/cloudinary.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListStockQueryDto } from './dto/list-stock-query.dto';

const CLOUDINARY_FOLDER = 'acces-sellr/distribution-products';

type ProductImage = { secure_url: string; public_id: string };

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private buildWhere(query: ListStockQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.sku) {
      where.sku = { contains: query.sku, mode: 'insensitive' };
    }
    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' };
    }
    if (query.isActive === 'true') where.isActive = true;
    if (query.isActive === 'false') where.isActive = false;
    if (query.lowStock === 'true') {
      where.currentStock = { lte: 0 };
    }
    if (query.fromCreatedAt || query.toCreatedAt) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (query.fromCreatedAt) dateFilter.gte = new Date(query.fromCreatedAt);
      if (query.toCreatedAt) dateFilter.lte = new Date(query.toCreatedAt);
      where.createdAt = dateFilter;
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      const searchMode = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { sku: searchMode },
        { name: searchMode },
        { description: searchMode },
        { brand: searchMode },
        { category: searchMode },
      ];
    }
    return where;
  }

  async findAll(query: ListStockQueryDto) {
    this.logger.log('findAll | entered');
    try {
      const page = typeof query.page === 'number' ? query.page : Math.max(1, parseInt(String(query.page), 10) || 1);
      const limit = typeof query.limit === 'number' ? query.limit : Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 20));
      const skip = (page - 1) * limit;
      const where = this.buildWhere(query);

      const validSort = ['createdAt', 'name', 'sku', 'currentStock', 'costPrice', 'category'] as const;
      const sortBy = validSort.includes(query.sortBy as any) ? (query.sortBy as (typeof validSort)[number]) : 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
      const orderBy = { [sortBy as string]: sortOrder } as any;

      const [items, total, allForAnalysis] = await Promise.all([
        this.prisma.distributionProduct.findMany({
          where: where as object,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.distributionProduct.count({ where: where as object }),
        this.prisma.distributionProduct.findMany({ where: where as object }),
      ]);

    const totalPages = Math.ceil(total / limit);
    const analysis = this.computeAnalysis(allForAnalysis);

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

      this.logger.log(`findAll | success | products: ${total}, page: ${page}/${totalPages}`);
      return ResponseHelper.success('Stock retrieved', payload);
    } catch (err) {
      this.logger.error(`findAll | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  private computeAnalysis(products: Array<{ currentStock: number; costPrice: number | null; reorderLevel: number | null; category: string | null; isActive: boolean }>) {
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const byCategory: Record<string, { count: number; quantity: number; value: number }> = {};

    for (const p of products) {
      if (!p.isActive) continue;
      totalQuantity += p.currentStock;
      totalValue += (p.costPrice ?? 0) * p.currentStock;
      if (p.currentStock === 0) outOfStockCount++;
      else if (p.reorderLevel != null && p.currentStock <= p.reorderLevel) lowStockCount++;

      const cat = p.category ?? '_uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, quantity: 0, value: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].quantity += p.currentStock;
      byCategory[cat].value += (p.costPrice ?? 0) * p.currentStock;
    }

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      totalQuantity,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category: category === '_uncategorized' ? null : category,
        count: data.count,
        quantity: data.quantity,
        value: Math.round(data.value * 100) / 100,
      })),
    };
  }

  async create(dto: CreateProductDto, files: Express.Multer.File[] = []) {
    this.logger.log(`create | entered | sku: ${dto.sku}`);
    try {
      const existing = await this.prisma.distributionProduct.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        this.logger.warn(`create | error | SKU already exists: ${dto.sku}`);
        throw new BadRequestException(`Product with SKU ${dto.sku} already exists`);
      }

      let images: ProductImage[] = [];
      if (files.length > 0) {
        const uploads = await this.cloudinary.uploadToCloudinary(files, CLOUDINARY_FOLDER);
        images = uploads.map((u: CloudinaryUploadResult) => ({
          secure_url: u.secure_url,
          public_id: u.public_id,
        }));
      }

      const product = await this.prisma.distributionProduct.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          description: dto.description ?? null,
          brand: dto.brand ?? null,
          model: dto.model ?? null,
          category: dto.category ?? null,
          unit: dto.unit ?? 'pieces',
          currentStock: dto.initialStock ?? 0,
          costPrice: dto.costPrice ?? null,
          normalSellingPrice: dto.normalSellingPrice ?? null,
          discountedSellingPrice: dto.discountedSellingPrice ?? null,
          reorderLevel: dto.reorderLevel ?? null,
          warehouseLocation: dto.warehouseLocation ?? null,
          images: images.length > 0 ? (images as object) : undefined,
          isActive: dto.isActive ?? true,
        },
      });

      this.logger.log(`create | success | sku: ${product.sku}, id: ${product.id}, images: ${images.length}`);
      return ResponseHelper.created('Product created successfully', product);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`create | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    this.logger.log(`addImages | entered | id: ${id}, files: ${files.length}`);
    try {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (files.length === 0) {
        throw new BadRequestException('No images provided');
      }

      const uploads = await this.cloudinary.uploadToCloudinary(files, CLOUDINARY_FOLDER);
      const newImages: ProductImage[] = uploads.map((u) => ({
        secure_url: u.secure_url,
        public_id: u.public_id,
      }));
      const existing = (product.images as ProductImage[] | null) ?? [];
      const combined = [...existing, ...newImages];

      const updated = await this.prisma.distributionProduct.update({
        where: { id },
        data: { images: combined as object },
      });

      this.logger.log(`addImages | success | id: ${id}, added: ${newImages.length}`);
      return ResponseHelper.success('Images added', updated);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`addImages | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async removeImage(id: string, publicId: string) {
    this.logger.log(`removeImage | entered | id: ${id}, publicId: ${publicId}`);
    try {
      if (!publicId?.trim()) {
        throw new BadRequestException('publicId is required');
      }
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const existing = (product.images as ProductImage[] | null) ?? [];
      const filtered = existing.filter((img) => img.public_id !== publicId);
      if (filtered.length === existing.length) {
        throw new BadRequestException('Image not found for this product');
      }

      await this.cloudinary.deleteFromCloudinary([publicId]);

      const updated = await this.prisma.distributionProduct.update({
        where: { id },
        data: { images: filtered },
      });

      this.logger.log(`removeImage | success | id: ${id}`);
      return ResponseHelper.success('Image removed', updated);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`removeImage | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async findOne(id: string) {
    this.logger.log(`findOne | entered | id: ${id}`);
    try {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        this.logger.warn(`findOne | error | not found: ${id}`);
        throw new NotFoundException('Product not found');
      }
      this.logger.log(`findOne | success | sku: ${product.sku}`);
      return ResponseHelper.success('Product retrieved', product);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`findOne | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    this.logger.log(`update | entered | id: ${id}`);
    try {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        this.logger.warn(`update | error | not found: ${id}`);
        throw new NotFoundException('Product not found');
      }
      if (dto.sku && dto.sku !== product.sku) {
        const existing = await this.prisma.distributionProduct.findUnique({
          where: { sku: dto.sku },
        });
        if (existing) {
          this.logger.warn(`update | error | SKU already exists: ${dto.sku}`);
          throw new BadRequestException(`Product with SKU ${dto.sku} already exists`);
        }
      }

      const updated = await this.prisma.distributionProduct.update({
        where: { id },
        data: {
            ...(dto.sku != null && { sku: dto.sku }),
          ...(dto.name != null && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description ?? null }),
          ...(dto.brand !== undefined && { brand: dto.brand ?? null }),
          ...(dto.model !== undefined && { model: dto.model ?? null }),
          ...(dto.category !== undefined && { category: dto.category ?? null }),
          ...(dto.unit !== undefined && { unit: dto.unit ?? 'pieces' }),
          ...(dto.costPrice !== undefined && { costPrice: dto.costPrice ?? null }),
          ...(dto.normalSellingPrice !== undefined && { normalSellingPrice: dto.normalSellingPrice ?? null }),
          ...(dto.discountedSellingPrice !== undefined && { discountedSellingPrice: dto.discountedSellingPrice ?? null }),
          ...(dto.reorderLevel !== undefined && { reorderLevel: dto.reorderLevel ?? null }),
          ...(dto.warehouseLocation !== undefined && { warehouseLocation: dto.warehouseLocation ?? null }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      this.logger.log(`update | success | sku: ${updated.sku}`);
      return ResponseHelper.success('Product updated', updated);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`update | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    this.logger.log(`adjustStock | entered | id: ${id}, qty: ${dto.quantity}`);
    try {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        this.logger.warn(`adjustStock | error | not found: ${id}`);
        throw new NotFoundException('Product not found');
      }
      const newStock = product.currentStock + dto.quantity;
      if (newStock < 0) {
        this.logger.warn(`adjustStock | error | would go negative: current=${product.currentStock}, delta=${dto.quantity}`);
        throw new BadRequestException(`Cannot reduce stock below 0. Current: ${product.currentStock}, requested adjustment: ${dto.quantity}`);
      }

      const updated = await this.prisma.distributionProduct.update({
        where: { id },
        data: { currentStock: newStock },
      });

      this.logger.log(`adjustStock | success | ${product.sku} ${dto.quantity >= 0 ? '+' : ''}${dto.quantity} = ${newStock}`);
      return ResponseHelper.success('Stock adjusted', updated);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`adjustStock | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async remove(id: string) {
    this.logger.log(`remove | entered | id: ${id}`);
    try {
      const product = await this.prisma.distributionProduct.findUnique({
        where: { id },
      });
      if (!product) {
        this.logger.warn(`remove | error | not found: ${id}`);
        throw new NotFoundException('Product not found');
      }

      const images = (product.images as ProductImage[] | null) ?? [];
      if (images.length > 0) {
        const publicIds = images.map((img) => img.public_id);
        await this.cloudinary.deleteFromCloudinary(publicIds);
      }

      await this.prisma.distributionProduct.delete({
        where: { id },
      });

      this.logger.log(`remove | success | sku: ${product.sku}, id: ${id}`);
      return ResponseHelper.success('Product deleted successfully', {
        id: product.id,
        sku: product.sku,
        name: product.name,
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`remove | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async search(query: string) {
    this.logger.log(`search | entered | q: ${query ?? '(empty)'}`);
    try {
      if (!query?.trim()) {
        this.logger.log('search | success | empty query, returning []');
        return ResponseHelper.success('Products', []);
      }
      const term = query.trim();
      const products = await this.prisma.distributionProduct.findMany({
        where: {
        isActive: true,
        OR: [
          { sku: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
        take: 20,
        select: { id: true, sku: true, name: true, currentStock: true, unit: true, costPrice: true },
      });
      this.logger.log(`search | success | found: ${products.length}`);
      return ResponseHelper.success('Products', products);
    } catch (err) {
      this.logger.error(`search | error | ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
}
