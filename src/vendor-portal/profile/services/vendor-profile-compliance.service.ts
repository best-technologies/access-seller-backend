import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AvendorDocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import {
  UpdateComplianceDocumentDto,
  UploadComplianceDocumentDto,
} from '../dto/upload-compliance-document.dto';
import * as colors from 'colors';

const DOC_STORAGE_FOLDER = 'avendors/vendors/documents';
const DOC_ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class VendorProfileComplianceService {
  private readonly logger = new Logger(VendorProfileComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadDocument(
    vendorId: string,
    dto: UploadComplianceDocumentDto,
    file: Express.Multer.File | undefined,
  ) {
    this.logger.log(
      colors.blue(`Supplier uploading compliance doc type="${dto.documentType}" vendor=${vendorId}`),
    );

    if (!file?.buffer?.length) {
      throw new BadRequestException('A document file (image) is required');
    }
    if (!DOC_ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        'Document must be a JPEG, PNG, WebP, or PDF file',
      );
    }

    let uploaded: StorageUploadResult[] = [];
    try {
      uploaded = await this.storage.upload([file], DOC_STORAGE_FOLDER);
      const [asset] = uploaded;

      const doc = await this.prisma.avendorVendorDocument.create({
        data: {
          vendorId,
          documentType: dto.documentType.toUpperCase(),
          label: dto.label,
          imageUrl: asset?.secure_url ?? null,
          imagePublicId: asset?.public_id ?? null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          status: AvendorDocumentStatus.pending,
        },
      });

      await this.recomputeCompliance(vendorId);

      this.logger.log(
        colors.green(`Compliance doc uploaded docId=${doc.id} vendor=${vendorId}`),
      );
      return ResponseHelper.created('Document uploaded', doc);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      this.logger.error(
        colors.red(
          `Compliance upload failed vendor=${vendorId}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      throw err;
    }
  }

  async updateDocument(
    vendorId: string,
    docId: string,
    dto: UpdateComplianceDocumentDto,
    file: Express.Multer.File | undefined,
  ) {
    this.logger.log(
      colors.blue(`Supplier updating compliance doc=${docId} vendor=${vendorId}`),
    );

    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const hasMeta =
      dto.documentType !== undefined ||
      dto.label !== undefined ||
      dto.expiresAt !== undefined;
    if (!hasMeta && !file?.buffer?.length) {
      throw new BadRequestException(
        'Provide at least one field or a new file to update the document',
      );
    }

    let uploaded: StorageUploadResult[] = [];
    try {
      const data: Prisma.AvendorVendorDocumentUpdateInput = {};

      if (file?.buffer?.length) {
        if (!DOC_ALLOWED_MIMES.has(file.mimetype)) {
          throw new BadRequestException(
            'Document must be a JPEG, PNG, WebP, or PDF file',
          );
        }
        uploaded = await this.storage.upload([file], DOC_STORAGE_FOLDER);
        const [asset] = uploaded;
        data.imageUrl = asset?.secure_url ?? null;
        data.imagePublicId = asset?.public_id ?? null;
        data.status = AvendorDocumentStatus.pending;
      }

      if (dto.documentType !== undefined) {
        data.documentType = dto.documentType.toUpperCase();
      }
      if (dto.label !== undefined) data.label = dto.label;
      if (dto.expiresAt !== undefined) {
        data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
      }

      const updated = await this.prisma.avendorVendorDocument.update({
        where: { id: docId },
        data,
      });

      if (file?.buffer?.length && doc.imagePublicId) {
        try {
          await this.storage.delete([doc.imagePublicId]);
        } catch (e) {
          this.logger.warn(
            `Old compliance image cleanup failed (${doc.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      await this.recomputeCompliance(vendorId);

      this.logger.log(
        colors.green(`Compliance doc updated docId=${docId} vendor=${vendorId}`),
      );
      return ResponseHelper.success('Document updated', updated);
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      throw err;
    }
  }

  async deleteDocument(vendorId: string, docId: string) {
    const doc = await this.prisma.avendorVendorDocument.findFirst({
      where: { id: docId, vendorId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.imagePublicId) {
      try {
        await this.storage.delete([doc.imagePublicId]);
      } catch (e) {
        this.logger.warn(
          `Failed to delete document image (${doc.imagePublicId}): ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    await this.prisma.avendorVendorDocument.delete({ where: { id: docId } });
    await this.recomputeCompliance(vendorId);

    this.logger.log(
      colors.yellow(`Compliance doc deleted docId=${docId} vendor=${vendorId}`),
    );
    return ResponseHelper.success('Document deleted', { id: docId });
  }

  /**
   * Same compliance rollup the admin-side service uses — keep semantics
   * consistent so the vendor and admin views agree.
   */
  private async recomputeCompliance(vendorId: string) {
    const docs = await this.prisma.avendorVendorDocument.findMany({
      where: { vendorId },
      select: { status: true },
    });

    let next: 'compliant' | 'non_compliant' | 'warning' = 'non_compliant';
    if (docs.length === 0) {
      next = 'non_compliant';
    } else if (docs.every((d) => d.status === AvendorDocumentStatus.valid)) {
      next = 'compliant';
    } else if (docs.some((d) => d.status === AvendorDocumentStatus.expired)) {
      next = 'warning';
    } else {
      next = 'warning';
    }

    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id: vendorId },
      select: { complianceOverride: true },
    });
    if (vendor?.complianceOverride) return;

    await this.prisma.avendorVendor.update({
      where: { id: vendorId },
      data: { complianceStatus: next },
    });
  }
}
