import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as argon from 'argon2';
import {
  AllowedPlatformTypeForAdmin,
  AvendorComplianceStatus,
  AvendorDocumentStatus,
  AvendorModuleAccessLevel,
  Prisma,
} from '@prisma/client';
import { DEFAULT_AVENDOR_ADMIN_PASSWORD } from 'src/auth/vendor/constants/a-vendor-auth.constants';
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
import {
  generateUniqueAvendorVendorCode,
  resolveAvendorVendorDbId,
} from '../../shared/utils/avendor-vendor-id.util';
import {
  allocateUniqueUsernameFromEmail,
  ensureUsernameAvailable,
  normalizeUsernameInput,
  USERNAME_REGEX,
  USERNAME_VALIDATION_MESSAGE,
} from 'src/shared/utils/username.util';
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

    const firstName = (dto.user?.first_name ?? dto.first_name)?.trim() ?? '';
    const lastName = (dto.user?.last_name ?? dto.last_name)?.trim() ?? '';
    if (!firstName || !lastName) {
      throw new BadRequestException(
        'Provide the portal contact with `user: { first_name, last_name }` or top-level `first_name` and `last_name`.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existingBefore = await this.prisma.user.findUnique({ where: { email } });
    const username = await this.resolveVendorPortalUsername(dto, existingBefore);

    const vendorCode = await generateUniqueAvendorVendorCode(this.prisma);
    const hashedPassword = await argon.hash(DEFAULT_AVENDOR_ADMIN_PASSWORD);

    const { vendor, user, linkedExistingUser } = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing?.avendorVendorId) {
          const stillLinked = await tx.avendorVendor.findUnique({
            where: { id: existing.avendorVendorId },
            select: { id: true },
          });
          if (stillLinked) {
            throw new ConflictException(
              'This user is already linked to a supplier account.',
            );
          }
        }

        const createdVendor = await tx.avendorVendor.create({
          data: {
            vendorCode,
            name: dto.name.trim(),
            email,
            phone: dto.phone?.trim() || null,
            industry: dto.industry?.trim() || null,
            address: dto.address?.trim() || null,
            city: dto.city?.trim() || null,
            country: dto.country?.trim() || 'Nigeria',
            status: dto.status ?? 'active',
          },
          include: VENDOR_INCLUDE,
        });

        if (existing) {
          const merged = new Set([
            ...(existing.allowedPlatformsForUser ?? []),
            AllowedPlatformTypeForAdmin.avendor,
          ]);
          const updated = await tx.user.update({
            where: { id: existing.id },
            data: {
              first_name: firstName,
              last_name: lastName,
              is_a_vendor: true,
              avendorVendorId: createdVendor.id,
              allowedPlatformsForUser: Array.from(merged),
              phone_number:
                dto.phone !== undefined
                  ? dto.phone?.trim() || null
                  : existing.phone_number,
              username,
            },
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              username: true,
            },
          });
          return {
            vendor: createdVendor,
            user: updated,
            linkedExistingUser: true,
          };
        }

        const createdUser = await tx.user.create({
          data: {
            first_name: firstName,
            last_name: lastName,
            email,
            password: hashedPassword,
            phone_number: dto.phone?.trim() || null,
            role: 'user',
            store_id: null,
            is_a_vendor: true,
            avendorVendorId: createdVendor.id,
            allowedPlatformsForUser: [AllowedPlatformTypeForAdmin.avendor],
            username,
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            username: true,
          },
        });

        return {
          vendor: createdVendor,
          user: createdUser,
          linkedExistingUser: false,
        };
      },
    );

    this.logger.log(
      colors.green(
        linkedExistingUser
          ? `Vendor created and linked: vendorId=${vendor.id} vendorCode=${vendor.vendorCode ?? 'n/a'} userId=${user.id} by=${caller.id}`
          : `Vendor + portal user created: vendorId=${vendor.id} vendorCode=${vendor.vendorCode ?? 'n/a'} userId=${user.id} by=${caller.id}`,
      ),
    );
    return ResponseHelper.created('Vendor created', {
      ...vendor,
      portalUser: user,
      linkedExistingUser,
      ...(linkedExistingUser
        ? {
            message:
              'Existing user linked to the new supplier. They use their current password to sign in.',
          }
        : {
            defaultPassword: DEFAULT_AVENDOR_ADMIN_PASSWORD,
            message:
              'Default password is set server-side. Share it securely and ask the contact to change it after first login.',
          }),
    });
  }

  private parseCreateVendorUsername(
    rawUsername: string | undefined,
  ): string | undefined {
    const u = normalizeUsernameInput(rawUsername);
    if (u === undefined) return undefined;
    if (!USERNAME_REGEX.test(u)) {
      throw new BadRequestException(USERNAME_VALIDATION_MESSAGE);
    }
    return u;
  }

  /**
   * Uses an explicit `user.username` when provided; otherwise reuses the existing
   * user’s handle or allocates a unique one from the contact email (no frontend value required).
   */
  private async resolveVendorPortalUsername(
    dto: CreateVendorDto,
    existingUser: { id: string; username: string | null } | null,
  ): Promise<string> {
    const explicit = this.parseCreateVendorUsername(
      dto.user?.username ?? dto.username,
    );
    if (explicit) {
      await ensureUsernameAvailable(this.prisma, explicit, existingUser?.id);
      return explicit;
    }
    if (existingUser?.username) {
      return existingUser.username;
    }
    return allocateUniqueUsernameFromEmail(
      this.prisma,
      dto.email.trim().toLowerCase(),
      existingUser?.id,
    );
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
          { vendorCode: { contains: search, mode: 'insensitive' } },
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

    const vendor = await this.prisma.avendorVendor.findFirst({
      where: { OR: [{ id }, { vendorCode: id }] },
      include: VENDOR_INCLUDE,
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    this.logger.log(colors.magenta(`Vendor retrieved: "${vendor.name}"`));
    return ResponseHelper.success('Vendor retrieved', vendor);
  }

  async updateVendor(id: string, dto: UpdateVendorDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Updating vendor id=${id}`));
    await this.assertCanEditVendors(caller);

    const dbId = await this.requireVendorDbId(id);

    const data: Prisma.AvendorVendorUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.industry !== undefined) data.industry = dto.industry.trim() || null;
    if (dto.address !== undefined) data.address = dto.address.trim() || null;
    if (dto.city !== undefined) data.city = dto.city.trim() || null;
    if (dto.country !== undefined) data.country = dto.country.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.totalOrders !== undefined) data.totalOrders = dto.totalOrders;
    if (dto.totalSpend !== undefined) data.totalSpend = dto.totalSpend;

    const updated = await this.prisma.avendorVendor.update({
      where: { id: dbId },
      data,
      include: VENDOR_INCLUDE,
    });

    this.logger.log(colors.green(`Vendor updated: id=${dbId} name="${updated.name}" by=${caller.id}`));
    return ResponseHelper.success('Vendor updated', updated);
  }

  async deleteVendor(id: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting vendor id=${id}`));
    await this.assertCanEditVendors(caller);

    const dbId = await this.requireVendorDbId(id);

    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id: dbId },
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

    await this.prisma.avendorVendor.delete({ where: { id: dbId } });

    this.logger.log(colors.yellow(`Vendor deleted: id=${dbId} name="${vendor.name}" by=${caller.id}`));
    return ResponseHelper.success('Vendor deleted', {
      id: vendor.id,
      vendorCode: vendor.vendorCode,
      name: vendor.name,
    });
  }

  // ─── BANK DETAILS ────────────────────────────────────────

  async upsertBank(vendorId: string, dto: UpsertVendorBankDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Upserting bank for vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const bank = await this.prisma.avendorVendorBank.upsert({
      where: { vendorId: dbId },
      create: {
        vendorId: dbId,
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

    this.logger.log(colors.green(`Bank details saved for vendor=${dbId} by=${caller.id}`));
    return ResponseHelper.success('Bank details saved', bank);
  }

  async deleteBank(vendorId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting bank for vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const bank = await this.prisma.avendorVendorBank.findUnique({ where: { vendorId: dbId } });
    if (!bank) throw new NotFoundException('No bank details found for this vendor');

    await this.prisma.avendorVendorBank.delete({ where: { vendorId: dbId } });

    this.logger.log(colors.yellow(`Bank details removed for vendor=${dbId} by=${caller.id}`));
    return ResponseHelper.success('Bank details removed', { vendorId: dbId });
  }

  // ─── NOTES ────────────────────────────────────────────────

  async addNote(vendorId: string, dto: CreateVendorNoteDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Adding note to vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const authorName = [caller.first_name, caller.last_name].filter(Boolean).join(' ') || null;

    const note = await this.prisma.avendorVendorNote.create({
      data: {
        vendorId: dbId,
        content: dto.content.trim(),
        authorId: caller.id,
        authorName,
      },
    });

    this.logger.log(colors.green(`Note added to vendor=${dbId} noteId=${note.id} by=${caller.id}`));
    return ResponseHelper.created('Note added', note);
  }

  async listNotes(vendorId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Listing notes for vendor=${vendorId}`));
    await this.assertCanViewVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const notes = await this.prisma.avendorVendorNote.findMany({
      where: { vendorId: dbId },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(colors.magenta(`Notes retrieved: ${notes.length} for vendor=${dbId}`));
    return ResponseHelper.success('Notes retrieved', notes);
  }

  async deleteNote(vendorId: string, noteId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting note=${noteId} from vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const note = await this.prisma.avendorVendorNote.findFirst({
      where: { id: noteId, vendorId: dbId },
    });
    if (!note) throw new NotFoundException('Note not found');

    await this.prisma.avendorVendorNote.delete({ where: { id: noteId } });

    this.logger.log(colors.yellow(`Note deleted: noteId=${noteId} vendor=${dbId} by=${caller.id}`));
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
    const dbId = await this.requireVendorDbId(vendorId);

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
          vendorId: dbId,
          documentType: dto.documentType.trim().toUpperCase(),
          label: dto.label.trim(),
          imageUrl,
          imagePublicId,
        },
      });

      await this.recomputeCompliance(dbId);

      this.logger.log(colors.green(`Document uploaded: docId=${doc.id} type="${doc.documentType}" vendor=${dbId} by=${caller.id}`));
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
    const dbId = await this.requireVendorDbId(vendorId);

    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId: dbId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.avendorVendorDocument.update({
      where: { id: docId },
      data: { status: dto.status },
    });

    await this.recomputeCompliance(dbId);

    this.logger.log(colors.green(`Document status updated: docId=${docId} status=${dto.status} by=${caller.id}`));
    return ResponseHelper.success('Document status updated', updated);
  }

  async deleteDocument(vendorId: string, docId: string, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Deleting document docId=${docId} from vendor=${vendorId}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId: dbId },
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
    await this.recomputeCompliance(dbId);

    this.logger.log(colors.yellow(`Document deleted: docId=${docId} vendor=${dbId} by=${caller.id}`));
    return ResponseHelper.success('Document deleted', { id: docId });
  }

  // ─── COMPLIANCE OVERRIDE ──────────────────────────────────

  async updateCompliance(vendorId: string, dto: UpdateComplianceDto, caller: AvendorVendorCaller) {
    this.logger.log(colors.blue(`Manual compliance override vendor=${vendorId} -> ${dto.complianceStatus}`));
    await this.assertCanEditVendors(caller);
    const dbId = await this.requireVendorDbId(vendorId);

    const updated = await this.prisma.avendorVendor.update({
      where: { id: dbId },
      data: {
        complianceStatus: dto.complianceStatus,
        complianceOverride: true,
      },
      include: VENDOR_INCLUDE,
    });

    this.logger.log(colors.green(`Compliance overridden: vendor=${dbId} status=${dto.complianceStatus} by=${caller.id}`));
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

  /** Resolves cuid or public `av-` code to the internal `AvendorVendor.id`. */
  private async requireVendorDbId(lookup: string): Promise<string> {
    const id = await resolveAvendorVendorDbId(this.prisma, lookup);
    if (!id) throw new NotFoundException('Vendor not found');
    return id;
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
