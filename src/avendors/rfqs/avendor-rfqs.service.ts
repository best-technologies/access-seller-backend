import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AvendorModuleAccessLevel,
  AvendorRfqStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { ListRfqsQueryDto } from './dto/list-rfqs-query.dto';
import { CreateRfqItemDto } from './dto/create-rfq.dto';
import { UpdateRfqItemDto } from './dto/update-rfq-item.dto';
import { AssignRfqVendorsDto } from './dto/assign-rfq-vendors.dto';
import * as colors from 'colors';

export type AvendorRfqCaller = {
  id: string;
  role: string;
  first_name?: string;
  last_name?: string;
};

const ATTACHMENT_FOLDER = 'avendors/rfqs/attachments';
const ATTACHMENT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const EDITABLE_STATUSES: AvendorRfqStatus[] = [
  AvendorRfqStatus.draft,
  AvendorRfqStatus.sent,
];

const RFQ_DETAIL_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      attachments: { orderBy: { createdAt: 'asc' as const } },
      material: {
        select: { id: true, name: true, unit: true, pricePerUnit: true },
      },
    },
  },
  vendors: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      vendor: {
        select: { id: true, name: true, email: true, rating: true, status: true },
      },
    },
  },
  attachments: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class AvendorRfqsService {
  private readonly logger = new Logger(AvendorRfqsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─── RFQ CRUD ─────────────────────────────────────────────

  async createRfq(dto: CreateRfqDto, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Creating RFQ title="${dto.title}"`));
    await this.assertCanEditRfqs(caller);

    const rfqNumber = await this.generateRfqNumber();
    const authorName =
      [caller.first_name, caller.last_name].filter(Boolean).join(' ') || null;

    const materialIds = dto.items.map((i) => i.materialId);
    const materials = await this.prisma.avendorMaterial.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, unit: true },
    });
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    for (const item of dto.items) {
      if (!materialMap.has(item.materialId)) {
        throw new BadRequestException(
          `Material with ID "${item.materialId}" does not exist.`,
        );
      }
    }

    const totalBudget = dto.items.reduce(
      (sum, item) => sum + (item.budget ?? 0),
      0,
    );

    let vendorIds: string[] = [];
    if (dto.sendToAllVendors) {
      const activeVendors = await this.prisma.avendorVendor.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      vendorIds = activeVendors.map((v) => v.id);
    } else if (dto.vendorIds?.length) {
      vendorIds = dto.vendorIds;
    }

    const rfq = await this.prisma.avendorRfq.create({
      data: {
        rfqNumber,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        dueDate: new Date(dto.dueDate),
        totalBudget,
        createdById: caller.id,
        createdByName: authorName,
        items: {
          create: dto.items.map((item) => {
            const mat = materialMap.get(item.materialId)!;
            return {
              materialId: item.materialId,
              materialName: mat.name,
              quantity: item.quantity,
              unit: mat.unit,
              budget: item.budget ?? 0,
              description: item.description?.trim() || null,
            };
          }),
        },
        ...(vendorIds.length > 0
          ? {
              vendors: {
                create: vendorIds.map((vid) => ({ vendorId: vid })),
              },
            }
          : {}),
      },
      include: RFQ_DETAIL_INCLUDE,
    });

    this.logger.log(
      colors.green(
        `RFQ created: ${rfq.rfqNumber} id=${rfq.id} items=${rfq.items.length} vendors=${rfq.vendors.length} by=${caller.id}`,
      ),
    );
    return ResponseHelper.created('RFQ created', rfq);
  }

  /** Categories with nested materials for RFQ item dropdowns (inventory picker). */
  async getMaterialCatalog(caller: AvendorRfqCaller) {
    this.logger.log(colors.blue('Fetching material catalog for RFQ UI'));
    await this.assertCanViewRfqs(caller);

    const categories = await this.prisma.avendorMaterialCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        materials: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            categoryId: true,
            unit: true,
            pricePerUnit: true,
            stock: true,
            imageUrl: true,
          },
        },
      },
    });

    this.logger.log(
      colors.magenta(
        `Material catalog: ${categories.length} categories, ${categories.reduce((n, c) => n + c.materials.length, 0)} materials`,
      ),
    );

    return ResponseHelper.success('Material catalog retrieved', categories);
  }

  async listRfqs(query: ListRfqsQueryDto, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue('Listing RFQs'));
    await this.assertCanViewRfqs(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const validSort = ['createdAt', 'dueDate', 'title', 'totalBudget'] as const;
    const sortBy = validSort.includes(query.sortBy as any)
      ? (query.sortBy as (typeof validSort)[number])
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const conditions: Prisma.AvendorRfqWhereInput[] = [];
    if (query.status) conditions.push({ status: query.status });
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { rfqNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.AvendorRfqWhereInput = conditions.length
      ? { AND: conditions }
      : {};

    const [rows, total, allForAnalysis] = await Promise.all([
      this.prisma.avendorRfq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { items: true, vendors: true } },
        },
      }),
      this.prisma.avendorRfq.count({ where }),
      this.prisma.avendorRfq.findMany({
        select: { status: true },
      }),
    ]);

    const analysis = this.computeAnalysis(allForAnalysis);

    this.logger.log(
      colors.magenta(`RFQs retrieved: ${rows.length} of ${total}, page=${page}`),
    );

    return ResponseHelper.success('RFQs retrieved', {
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

  async getRfq(id: string, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Fetching RFQ id=${id}`));
    await this.assertCanViewRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({
      where: { id },
      include: RFQ_DETAIL_INCLUDE,
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    this.logger.log(colors.magenta(`RFQ retrieved: ${rfq.rfqNumber}`));
    return ResponseHelper.success('RFQ retrieved', rfq);
  }

  async updateRfq(id: string, dto: UpdateRfqDto, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Updating RFQ id=${id}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertEditable(rfq.status);

    const data: Prisma.AvendorRfqUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;

    const updated = await this.prisma.avendorRfq.update({
      where: { id },
      data,
      include: RFQ_DETAIL_INCLUDE,
    });

    this.logger.log(
      colors.green(`RFQ updated: ${updated.rfqNumber} by=${caller.id}`),
    );
    return ResponseHelper.success('RFQ updated', updated);
  }

  async deleteRfq(id: string, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Deleting RFQ id=${id}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({
      where: { id },
      include: {
        attachments: { select: { imagePublicId: true } },
        items: {
          include: {
            attachments: { select: { imagePublicId: true } },
          },
        },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const publicIds: string[] = [];
    rfq.attachments.forEach((a) => {
      if (a.imagePublicId) publicIds.push(a.imagePublicId);
    });
    rfq.items.forEach((item) =>
      item.attachments.forEach((a) => {
        if (a.imagePublicId) publicIds.push(a.imagePublicId);
      }),
    );

    if (publicIds.length > 0) {
      try {
        await this.storage.delete(publicIds);
        this.logger.log(`Cleaned up ${publicIds.length} attachment(s) from storage`);
      } catch (e) {
        this.logger.warn(
          `Failed to cleanup attachments: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorRfq.delete({ where: { id } });

    this.logger.log(
      colors.yellow(
        `RFQ deleted: ${rfq.rfqNumber} id=${id} by=${caller.id}`,
      ),
    );
    return ResponseHelper.success('RFQ deleted', {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
    });
  }

  // ─── ITEMS ────────────────────────────────────────────────

  async addItem(rfqId: string, dto: CreateRfqItemDto, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Adding item to RFQ=${rfqId}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertEditable(rfq.status);

    const material = await this.prisma.avendorMaterial.findUnique({
      where: { id: dto.materialId },
      select: { id: true, name: true, unit: true },
    });
    if (!material) {
      throw new BadRequestException(
        `Material with ID "${dto.materialId}" does not exist.`,
      );
    }

    const item = await this.prisma.avendorRfqItem.create({
      data: {
        rfqId,
        materialId: material.id,
        materialName: material.name,
        quantity: dto.quantity,
        unit: material.unit,
        budget: dto.budget ?? 0,
        description: dto.description?.trim() || null,
      },
      include: {
        attachments: true,
        material: {
          select: { id: true, name: true, unit: true, pricePerUnit: true },
        },
      },
    });

    await this.recomputeTotalBudget(rfqId);

    this.logger.log(
      colors.green(`Item added: itemId=${item.id} rfq=${rfqId} by=${caller.id}`),
    );
    return ResponseHelper.created('Item added', item);
  }

  async updateItem(
    rfqId: string,
    itemId: string,
    dto: UpdateRfqItemDto,
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(colors.blue(`Updating item=${itemId} on RFQ=${rfqId}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertEditable(rfq.status);

    const item = await this.prisma.avendorRfqItem.findFirst({
      where: { id: itemId, rfqId },
    });
    if (!item) throw new NotFoundException('Item not found');

    const data: Prisma.AvendorRfqItemUpdateInput = {};
    if (dto.materialId !== undefined) {
      const material = await this.prisma.avendorMaterial.findUnique({
        where: { id: dto.materialId },
        select: { id: true, name: true, unit: true },
      });
      if (!material) {
        throw new BadRequestException(
          `Material with ID "${dto.materialId}" does not exist.`,
        );
      }
      data.material = { connect: { id: material.id } };
      data.materialName = material.name;
      data.unit = material.unit;
    }
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;

    const updated = await this.prisma.avendorRfqItem.update({
      where: { id: itemId },
      data,
      include: {
        attachments: true,
        material: {
          select: { id: true, name: true, unit: true, pricePerUnit: true },
        },
      },
    });

    await this.recomputeTotalBudget(rfqId);

    this.logger.log(
      colors.green(`Item updated: itemId=${itemId} rfq=${rfqId} by=${caller.id}`),
    );
    return ResponseHelper.success('Item updated', updated);
  }

  async deleteItem(rfqId: string, itemId: string, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Deleting item=${itemId} from RFQ=${rfqId}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertEditable(rfq.status);

    const item = await this.prisma.avendorRfqItem.findFirst({
      where: { id: itemId, rfqId },
      include: { attachments: { select: { imagePublicId: true } } },
    });
    if (!item) throw new NotFoundException('Item not found');

    const publicIds = item.attachments
      .map((a) => a.imagePublicId)
      .filter((pid): pid is string => Boolean(pid));

    if (publicIds.length > 0) {
      try {
        await this.storage.delete(publicIds);
      } catch (e) {
        this.logger.warn(
          `Failed to cleanup item attachments: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorRfqItem.delete({ where: { id: itemId } });
    await this.recomputeTotalBudget(rfqId);

    this.logger.log(
      colors.yellow(`Item deleted: itemId=${itemId} rfq=${rfqId} by=${caller.id}`),
    );
    return ResponseHelper.success('Item deleted', { id: itemId });
  }

  // ─── ITEM ATTACHMENTS ─────────────────────────────────────

  async uploadItemAttachments(
    rfqId: string,
    itemId: string,
    files: Express.Multer.File[],
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(
      colors.blue(
        `Uploading ${files.length} attachment(s) to item=${itemId} rfq=${rfqId}`,
      ),
    );
    await this.assertCanEditRfqs(caller);

    const item = await this.prisma.avendorRfqItem.findFirst({
      where: { id: itemId, rfqId },
    });
    if (!item) throw new NotFoundException('Item not found');

    this.validateAttachmentMimes(files);

    let uploaded: StorageUploadResult[] = [];
    try {
      uploaded = await this.storage.upload(files, ATTACHMENT_FOLDER);

      const attachments = await this.prisma.$transaction(
        uploaded.map((u, i) =>
          this.prisma.avendorRfqItemAttachment.create({
            data: {
              rfqItemId: itemId,
              imageUrl: u.secure_url,
              imagePublicId: u.public_id,
              originalFilename: files[i]?.originalname || u.original_filename || null,
            },
          }),
        ),
      );

      this.logger.log(
        colors.green(
          `${attachments.length} item attachment(s) uploaded for item=${itemId} by=${caller.id}`,
        ),
      );
      return ResponseHelper.created('Item attachments uploaded', attachments);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async deleteItemAttachment(
    rfqId: string,
    itemId: string,
    attachmentId: string,
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(
      colors.blue(
        `Deleting item attachment=${attachmentId} item=${itemId} rfq=${rfqId}`,
      ),
    );
    await this.assertCanEditRfqs(caller);

    const attachment = await this.prisma.avendorRfqItemAttachment.findFirst({
      where: { id: attachmentId, rfqItemId: itemId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (attachment.imagePublicId) {
      try {
        await this.storage.delete([attachment.imagePublicId]);
      } catch (e) {
        this.logger.warn(
          `Failed to delete attachment image: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorRfqItemAttachment.delete({
      where: { id: attachmentId },
    });

    this.logger.log(
      colors.yellow(
        `Item attachment deleted: ${attachmentId} by=${caller.id}`,
      ),
    );
    return ResponseHelper.success('Attachment deleted', { id: attachmentId });
  }

  // ─── RFQ ATTACHMENTS ──────────────────────────────────────

  async uploadRfqAttachments(
    rfqId: string,
    files: Express.Multer.File[],
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(
      colors.blue(`Uploading ${files.length} attachment(s) to RFQ=${rfqId}`),
    );
    await this.assertCanEditRfqs(caller);
    await this.assertRfqExists(rfqId);

    this.validateAttachmentMimes(files);

    let uploaded: StorageUploadResult[] = [];
    try {
      uploaded = await this.storage.upload(files, ATTACHMENT_FOLDER);

      const attachments = await this.prisma.$transaction(
        uploaded.map((u, i) =>
          this.prisma.avendorRfqAttachment.create({
            data: {
              rfqId,
              imageUrl: u.secure_url,
              imagePublicId: u.public_id,
              originalFilename: files[i]?.originalname || u.original_filename || null,
            },
          }),
        ),
      );

      this.logger.log(
        colors.green(
          `${attachments.length} RFQ attachment(s) uploaded for rfq=${rfqId} by=${caller.id}`,
        ),
      );
      return ResponseHelper.created('RFQ attachments uploaded', attachments);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async deleteRfqAttachment(
    rfqId: string,
    attachmentId: string,
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(
      colors.blue(`Deleting RFQ attachment=${attachmentId} rfq=${rfqId}`),
    );
    await this.assertCanEditRfqs(caller);

    const attachment = await this.prisma.avendorRfqAttachment.findFirst({
      where: { id: attachmentId, rfqId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (attachment.imagePublicId) {
      try {
        await this.storage.delete([attachment.imagePublicId]);
      } catch (e) {
        this.logger.warn(
          `Failed to delete RFQ attachment image: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorRfqAttachment.delete({
      where: { id: attachmentId },
    });

    this.logger.log(
      colors.yellow(`RFQ attachment deleted: ${attachmentId} by=${caller.id}`),
    );
    return ResponseHelper.success('Attachment deleted', { id: attachmentId });
  }

  // ─── VENDOR ASSIGNMENT ────────────────────────────────────

  async assignVendors(
    rfqId: string,
    dto: AssignRfqVendorsDto,
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(colors.blue(`Assigning vendors to RFQ=${rfqId}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertEditable(rfq.status);

    let vendorIds: string[];
    if (dto.sendToAllVendors) {
      const activeVendors = await this.prisma.avendorVendor.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      vendorIds = activeVendors.map((v) => v.id);
    } else {
      vendorIds = dto.vendorIds;
    }

    if (!vendorIds.length) {
      throw new BadRequestException('No vendors to assign');
    }

    await this.prisma.avendorRfqVendor.deleteMany({ where: { rfqId } });

    const created = await this.prisma.$transaction(
      vendorIds.map((vid) =>
        this.prisma.avendorRfqVendor.create({
          data: { rfqId, vendorId: vid },
          include: {
            vendor: {
              select: { id: true, name: true, email: true, rating: true, status: true },
            },
          },
        }),
      ),
    );

    this.logger.log(
      colors.green(
        `${created.length} vendor(s) assigned to RFQ=${rfqId} by=${caller.id}`,
      ),
    );
    return ResponseHelper.success('Vendors assigned', created);
  }

  async removeVendor(
    rfqId: string,
    vendorId: string,
    caller: AvendorRfqCaller,
  ) {
    this.logger.log(
      colors.blue(`Removing vendor=${vendorId} from RFQ=${rfqId}`),
    );
    await this.assertCanEditRfqs(caller);

    const assignment = await this.prisma.avendorRfqVendor.findFirst({
      where: { rfqId, vendorId },
    });
    if (!assignment)
      throw new NotFoundException('Vendor not assigned to this RFQ');

    await this.prisma.avendorRfqVendor.delete({
      where: { id: assignment.id },
    });

    this.logger.log(
      colors.yellow(
        `Vendor removed: vendor=${vendorId} rfq=${rfqId} by=${caller.id}`,
      ),
    );
    return ResponseHelper.success('Vendor removed', {
      rfqId,
      vendorId,
    });
  }

  // ─── SEND RFQ ─────────────────────────────────────────────

  async sendRfq(rfqId: string, caller: AvendorRfqCaller) {
    this.logger.log(colors.blue(`Sending RFQ=${rfqId}`));
    await this.assertCanEditRfqs(caller);

    const rfq = await this.prisma.avendorRfq.findUnique({
      where: { id: rfqId },
      include: {
        _count: { select: { items: true, vendors: true } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    if (rfq.status !== AvendorRfqStatus.draft) {
      throw new BadRequestException(
        `Only draft RFQs can be sent. Current status: ${rfq.status}`,
      );
    }
    if (rfq._count.items === 0) {
      throw new BadRequestException(
        'Cannot send an RFQ with no items. Add at least one item first.',
      );
    }
    if (rfq._count.vendors === 0) {
      throw new BadRequestException(
        'Cannot send an RFQ with no vendors. Assign at least one vendor first.',
      );
    }

    const now = new Date();

    const updated = await this.prisma.avendorRfq.update({
      where: { id: rfqId },
      data: {
        status: AvendorRfqStatus.sent,
        sentAt: now,
      },
      include: RFQ_DETAIL_INCLUDE,
    });

    await this.prisma.avendorRfqVendor.updateMany({
      where: { rfqId },
      data: { sentAt: now },
    });

    this.logger.log(
      colors.green(
        `RFQ sent: ${updated.rfqNumber} to ${rfq._count.vendors} vendor(s) by=${caller.id}`,
      ),
    );
    return ResponseHelper.success('RFQ sent to vendors', updated);
  }

  // ─── RFQ NUMBER GENERATION ────────────────────────────────

  private async generateRfqNumber(retries = 3): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RFQ-${year}-`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const latest = await this.prisma.avendorRfq.findFirst({
        where: { rfqNumber: { startsWith: prefix } },
        orderBy: { rfqNumber: 'desc' },
        select: { rfqNumber: true },
      });

      let seq = 1;
      if (latest?.rfqNumber) {
        const lastSeq = parseInt(latest.rfqNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }

      const rfqNumber = `${prefix}${seq.toString().padStart(4, '0')}`;

      const exists = await this.prisma.avendorRfq.findUnique({
        where: { rfqNumber },
        select: { id: true },
      });
      if (!exists) return rfqNumber;

      this.logger.warn(
        `RFQ number collision on ${rfqNumber}, retrying (${attempt + 1}/${retries})`,
      );
    }

    throw new ConflictException(
      'Unable to generate a unique RFQ number. Please try again.',
    );
  }

  // ─── TOTAL BUDGET RECOMPUTE ───────────────────────────────

  private async recomputeTotalBudget(rfqId: string): Promise<void> {
    const aggregate = await this.prisma.avendorRfqItem.aggregate({
      where: { rfqId },
      _sum: { budget: true },
    });
    const totalBudget = aggregate._sum.budget ?? 0;

    await this.prisma.avendorRfq.update({
      where: { id: rfqId },
      data: { totalBudget },
    });

    this.logger.log(
      colors.cyan(`Total budget recomputed: rfq=${rfqId} -> ${totalBudget}`),
    );
  }

  // ─── ANALYSIS ─────────────────────────────────────────────

  private computeAnalysis(rfqs: Array<{ status: string }>) {
    let draftCount = 0;
    let sentCount = 0;
    let awardedCount = 0;

    for (const r of rfqs) {
      switch (r.status) {
        case 'draft':
          draftCount++;
          break;
        case 'sent':
        case 'awaiting_selection':
          sentCount++;
          break;
        case 'awarded':
          awardedCount++;
          break;
      }
    }

    return {
      totalRfqs: rfqs.length,
      draftCount,
      sentCount,
      awardedCount,
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────

  private async assertRfqExists(id: string): Promise<void> {
    const rfq = await this.prisma.avendorRfq.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
  }

  private assertEditable(status: AvendorRfqStatus): void {
    if (!EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `This RFQ cannot be modified in its current status (${status}). Only draft or sent RFQs can be edited.`,
      );
    }
  }

  private validateAttachmentMimes(files: Express.Multer.File[]): void {
    for (const f of files) {
      if (!ATTACHMENT_MIMES.has(f.mimetype)) {
        throw new BadRequestException(
          `File "${f.originalname}" has unsupported type (${f.mimetype}). Allowed: JPEG, PNG, WebP, PDF.`,
        );
      }
    }
  }

  // ─── AUTHORIZATION ────────────────────────────────────────

  private async assertCanViewRfqs(caller: AvendorRfqCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { rfqs: true },
    });
    if (!perm || perm.rfqs === AvendorModuleAccessLevel.no_access) {
      throw new ForbiddenException(
        'You need at least view access to A-Vendor RFQs to perform this action.',
      );
    }
  }

  private async assertCanEditRfqs(caller: AvendorRfqCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { rfqs: true },
    });
    if (!perm || perm.rfqs !== AvendorModuleAccessLevel.full_access) {
      throw new ForbiddenException(
        'You need full access to A-Vendor RFQs to perform this action.',
      );
    }
  }
}
