import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AvendorComplianceStatus,
  AvendorDocumentStatus,
  AvendorModuleAccessLevel,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpsertVendorBankDto } from './dto/upsert-vendor-bank.dto';
import { CreateVendorNoteDto } from './dto/create-vendor-note.dto';
import { UploadVendorDocumentDto } from './dto/upload-vendor-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import * as colors from 'colors';

export type AvendorVendorCaller = { id: string; role: string; first_name?: string; last_name?: string };

const DOCUMENT_STORAGE_FOLDER = 'avendors/vendors/documents';
const DOC_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const VENDOR_INCLUDE = {
  bankDetail: true,
  documents: { orderBy: { createdAt: 'desc' as const } },
  notes: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class AvendorVendorsService {
  private readonly logger = new Logger(AvendorVendorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─── VENDOR CRUD ──────────────────────────────────────────

  async createVendor(dto: CreateVendorDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Creating vendor name="${dto.name}"`));
    await this.assertCanEditVendors(caller);

    const vendor = await this.prisma.avendorVendor.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || 'Nigeria',
        status: dto.status ?? 'active',
      },
      include: VENDOR_INCLUDE,
    });

    this.logger.log(colors.green(`Vendor created: id=${vendor.id} name="${vendor.name}" by=${caller.id}`));
    return ResponseHelper.created('Vendor created', vendor);
  }

  async listVendors(query: ListVendorsQueryDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue('Listing all A-Vendor vendors'));
    await this.assertCanViewVendors(caller);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const validSort = ['createdAt', 'name', 'totalOrders', 'totalSpend', 'rating'] as const;
    const sortBy = validSort.includes(query.sortBy as any) ? (query.sortBy as (typeof validSort)[number]) : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const conditions: Prisma.AvendorVendorWhereInput[] = [];
    if (query.status) conditions.push({ status: query.status });
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.AvendorVendorWhereInput = conditions.length ? { AND: conditions } : {};

    const [rows, total, allForAnalysis] = await Promise.all([
      this.prisma.avendorVendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          documents: { select: { id: true, status: true } },
          _count: { select: { notes: true } },
        },
      }),
      this.prisma.avendorVendor.count({ where }),
      this.prisma.avendorVendor.findMany({
        select: { status: true, complianceStatus: true },
      }),
    ]);

    const analysis = this.computeAnalysis(allForAnalysis);

    this.logger.log(colors.magenta(`Vendors retrieved: ${rows.length} of ${total}, page=${page}`));

    return ResponseHelper.success('Vendors retrieved', {
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

  async getVendor(id: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Fetching vendor id=${id}`));
    await this.assertCanViewVendors(caller);

    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id },
      include: VENDOR_INCLUDE,
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    this.logger.log(colors.magenta(`Vendor retrieved: "${vendor.name}"`));
    return ResponseHelper.success('Vendor retrieved', vendor);
  }

  async updateVendor(id: string, dto: UpdateVendorDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Updating vendor id=${id}`));
    await this.assertCanEditVendors(caller);

    const vendor = await this.prisma.avendorVendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const data: Prisma.AvendorVendorUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.city !== undefined) data.city = dto.city.trim() || null;
    if (dto.country !== undefined) data.country = dto.country.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.totalOrders !== undefined) data.totalOrders = dto.totalOrders;
    if (dto.totalSpend !== undefined) data.totalSpend = dto.totalSpend;

    const updated = await this.prisma.avendorVendor.update({
      where: { id },
      data,
      include: VENDOR_INCLUDE,
    });

    this.logger.log(colors.green(`Vendor updated: id=${id} name="${updated.name}" by=${caller.id}`));
    return ResponseHelper.success('Vendor updated', updated);
  }

  async deleteVendor(id: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting vendor id=${id}`));
    await this.assertCanEditVendors(caller);

    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id },
      include: { documents: { select: { imagePublicId: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const publicIds = vendor.documents
      .map((d) => d.imagePublicId)
      .filter((pid): pid is string => Boolean(pid));

    if (publicIds.length > 0) {
      try {
        await this.storage.delete(publicIds);
        this.logger.log(`Cleaned up ${publicIds.length} document image(s) from storage`);
      } catch (e) {
        this.logger.warn(`Failed to cleanup document images: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.prisma.avendorVendor.delete({ where: { id } });

    this.logger.log(colors.yellow(`Vendor deleted: id=${id} name="${vendor.name}" by=${caller.id}`));
    return ResponseHelper.success('Vendor deleted', { id: vendor.id, name: vendor.name });
  }

  // ─── BANK DETAILS ────────────────────────────────────────

  async upsertBank(vendorId: string, dto: UpsertVendorBankDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Upserting bank for vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    await this.assertVendorExists(vendorId);

    const bank = await this.prisma.avendorVendorBank.upsert({
      where: { vendorId },
      create: {
        vendorId,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
      },
      update: {
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
      },
    });

    this.logger.log(colors.green(`Bank details saved for vendor=${vendorId} by=${caller.id}`));
    return ResponseHelper.success('Bank details saved', bank);
  }

  async deleteBank(vendorId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting bank for vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);

    const bank = await this.prisma.avendorVendorBank.findUnique({ where: { vendorId } });
    if (!bank) throw new NotFoundException('No bank details found for this vendor');

    await this.prisma.avendorVendorBank.delete({ where: { vendorId } });

    this.logger.log(colors.yellow(`Bank details removed for vendor=${vendorId} by=${caller.id}`));
    return ResponseHelper.success('Bank details removed', { vendorId });
  }

  // ─── NOTES ────────────────────────────────────────────────

  async addNote(vendorId: string, dto: CreateVendorNoteDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Adding note to vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    await this.assertVendorExists(vendorId);

    const authorName = [caller.first_name, caller.last_name].filter(Boolean).join(' ') || null;

    const note = await this.prisma.avendorVendorNote.create({
      data: {
        vendorId,
        content: dto.content.trim(),
        authorId: caller.id,
        authorName,
      },
    });

    this.logger.log(colors.green(`Note added to vendor=${vendorId} noteId=${note.id} by=${caller.id}`));
    return ResponseHelper.created('Note added', note);
  }

  async listNotes(vendorId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Listing notes for vendor=${vendorId}`));
    await this.assertCanViewVendors(caller);
    await this.assertVendorExists(vendorId);

    const notes = await this.prisma.avendorVendorNote.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(colors.magenta(`Notes retrieved: ${notes.length} for vendor=${vendorId}`));
    return ResponseHelper.success('Notes retrieved', notes);
  }

  async deleteNote(vendorId: string, noteId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting note=${noteId} from vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);

    const note = await this.prisma.avendorVendorNote.findFirst({
      where: { id: noteId, vendorId },
    });
    if (!note) throw new NotFoundException('Note not found');

    await this.prisma.avendorVendorNote.delete({ where: { id: noteId } });

    this.logger.log(colors.yellow(`Note deleted: noteId=${noteId} vendor=${vendorId} by=${caller.id}`));
    return ResponseHelper.success('Note deleted', { id: noteId });
  }

  // ─── COMPLIANCE DOCUMENTS ─────────────────────────────────

  async uploadDocument(
    vendorId: string,
    dto: UploadVendorDocumentDto,
    file: Express.Multer.File | undefined,
    caller: AvendorVendorCaller,
  ) {
    this.logger.log(colors.blue(`Uploading document type="${dto.documentType}" for vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    await this.assertVendorExists(vendorId);

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;
    let uploaded: StorageUploadResult[] = [];

    try {
      if (file?.buffer?.length) {
        if (!DOC_IMAGE_MIMES.has(file.mimetype)) {
          throw new BadRequestException('Document must be a JPEG, PNG, WebP, or PDF file');
        }
        uploaded = await this.storage.upload([file], DOCUMENT_STORAGE_FOLDER);
        imageUrl = uploaded[0]?.secure_url ?? null;
        imagePublicId = uploaded[0]?.public_id ?? null;
      }

      const doc = await this.prisma.avendorVendorDocument.create({
        data: {
          vendorId,
          documentType: dto.documentType.trim().toUpperCase(),
          label: dto.label.trim(),
          imageUrl,
          imagePublicId,
        },
      });

      await this.recomputeCompliance(vendorId);

      this.logger.log(colors.green(`Document uploaded: docId=${doc.id} type="${doc.documentType}" vendor=${vendorId} by=${caller.id}`));
      return ResponseHelper.created('Document uploaded', doc);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async updateDocumentStatus(
    vendorId: string,
    docId: string,
    dto: UpdateDocumentStatusDto,
    caller: AvendorVendorCaller,
  ) {
    this.logger.log(colors.blue(`Updating document status docId=${docId} -> ${dto.status}`));
    await this.assertCanEditVendors(caller);

    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.avendorVendorDocument.update({
      where: { id: docId },
      data: { status: dto.status },
    });

    await this.recomputeCompliance(vendorId);

    this.logger.log(colors.green(`Document status updated: docId=${docId} status=${dto.status} by=${caller.id}`));
    return ResponseHelper.success('Document status updated', updated);
  }

  async deleteDocument(vendorId: string, docId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting document docId=${docId} from vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);

    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.imagePublicId) {
      try {
        await this.storage.delete([doc.imagePublicId]);
        this.logger.log(`Removed document image from storage: ${doc.imagePublicId}`);
      } catch (e) {
        this.logger.warn(`Failed to delete document image (${doc.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.prisma.avendorVendorDocument.delete({ where: { id: docId } });
    await this.recomputeCompliance(vendorId);

    this.logger.log(colors.yellow(`Document deleted: docId=${docId} vendor=${vendorId} by=${caller.id}`));
    return ResponseHelper.success('Document deleted', { id: docId });
  }

  // ─── COMPLIANCE OVERRIDE ──────────────────────────────────

  async updateCompliance(vendorId: string, dto: UpdateComplianceDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Manual compliance override vendor=${vendorId} -> ${dto.complianceStatus}`));
    await this.assertCanEditVendors(caller);
    await this.assertVendorExists(vendorId);

    const updated = await this.prisma.avendorVendor.update({
      where: { id: vendorId },
      data: {
        complianceStatus: dto.complianceStatus,
        complianceOverride: true,
      },
      include: VENDOR_INCLUDE,
    });

    this.logger.log(colors.green(`Compliance overridden: vendor=${vendorId} status=${dto.complianceStatus} by=${caller.id}`));
    return ResponseHelper.success('Compliance status updated', updated);
  }

  // ─── COMPLIANCE AUTO-COMPUTATION ──────────────────────────

  private async recomputeCompliance(vendorId: string): Promise<void> {
    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id: vendorId },
      select: { complianceOverride: true },
    });
    if (!vendor || vendor.complianceOverride) return;

    const docs = await this.prisma.avendorVendorDocument.findMany({
      where: { vendorId },
      select: { status: true },
    });

    let computed: AvendorComplianceStatus;

    if (docs.length === 0) {
      computed = AvendorComplianceStatus.non_compliant;
    } else if (docs.every((d) => d.status === AvendorDocumentStatus.valid)) {
      computed = AvendorComplianceStatus.compliant;
    } else if (docs.some((d) => d.status === AvendorDocumentStatus.expired)) {
      computed = AvendorComplianceStatus.warning;
    } else {
      computed = AvendorComplianceStatus.non_compliant;
    }

    await this.prisma.avendorVendor.update({
      where: { id: vendorId },
      data: { complianceStatus: computed },
    });

    this.logger.log(colors.cyan(`Compliance recomputed: vendor=${vendorId} -> ${computed}`));
  }

  // ─── ANALYSIS ─────────────────────────────────────────────

  private computeAnalysis(
    vendors: Array<{ status: string; complianceStatus: string }>,
  ) {
    let activeVendors = 0;
    let inactiveVendors = 0;
    let complianceRiskCount = 0;

    for (const v of vendors) {
      if (v.status === 'active') activeVendors++;
      else inactiveVendors++;
      if (v.complianceStatus !== 'compliant') complianceRiskCount++;
    }

    return {
      totalVendors: vendors.length,
      activeVendors,
      inactiveVendors,
      complianceRiskCount,
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────

  private async assertVendorExists(id: string): Promise<void> {
    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
  }

  // ─── AUTHORIZATION ────────────────────────────────────────

  private async assertCanViewVendors(caller: AvendorVendorCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { vendors_management: true },
    });
    if (!perm || perm.vendors_management === AvendorModuleAccessLevel.no_access) {
      throw new ForbiddenException(
        'You need at least view access to A-Vendor Vendors management to perform this action.',
      );
    }
  }

  private async assertCanEditVendors(caller: AvendorVendorCaller) {
    if (caller.role === 'super_admin') return;
    const perm = await this.prisma.avendorPermission.findUnique({
      where: { userId: caller.id },
      select: { vendors_management: true },
    });
    if (!perm || perm.vendors_management !== AvendorModuleAccessLevel.full_access) {
      throw new ForbiddenException(
        'You need full access to A-Vendor Vendors management to perform this action.',
      );
    }
  }
}
