import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { S3Service } from './s3.service';
import type { StorageUploadResult } from './storage.types';

export type { StorageUploadResult };

const PROVIDER_CLOUDINARY = 'cloudinary';
const PROVIDER_AWS_S3 = 'aws-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private config: ConfigService,
    private cloudinary: CloudinaryService,
    private s3: S3Service,
  ) {}

  private getProvider(): string {
    const provider = (this.config.get<string>('STORAGE_PROVIDER') ?? PROVIDER_CLOUDINARY).toLowerCase();
    return provider === PROVIDER_AWS_S3 ? PROVIDER_AWS_S3 : PROVIDER_CLOUDINARY;
  }

  /**
   * Upload files to the configured storage (cloudinary or aws-s3).
   * @param files - Files to upload
   * @param folder - Folder/path (e.g. "distribution/stocks", "distribution/invoices")
   */
  async upload(
    files: Array<Express.Multer.File>,
    folder: string = 'store-docs',
  ): Promise<StorageUploadResult[]> {
    const provider = this.getProvider();
    this.logger.log(`Storage: uploading ${files.length} file(s) to ${provider} folder "${folder}"`);

    if (provider === PROVIDER_AWS_S3) {
      return this.s3.upload(files, folder);
    }
    const results = await this.cloudinary.uploadToCloudinary(files, folder);
    return results.map((r) => ({
      secure_url: r.secure_url,
      public_id: r.public_id,
      original_filename: r.original_filename,
    }));
  }

  /**
   * Delete objects by id (Cloudinary public_id or S3 object key).
   */
  async delete(publicIds: string[]): Promise<void> {
    const provider = this.getProvider();
    this.logger.log(`Storage: deleting ${publicIds.length} object(s) from ${provider}`);

    if (provider === PROVIDER_AWS_S3) {
      await this.s3.delete(publicIds);
      return;
    }
    await this.cloudinary.deleteFromCloudinary(publicIds);
  }

  /**
   * Clean up previously uploaded files (e.g. on error after upload).
   */
  async cleanupUploadedFiles(uploadResults: StorageUploadResult[]): Promise<void> {
    if (!uploadResults?.length) return;
    const ids = uploadResults.map((r) => r.public_id);
    try {
      await this.delete(ids);
    } catch (err) {
      this.logger.warn('Cleanup of uploaded files failed (non-fatal)', err);
    }
  }
}
