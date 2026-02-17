import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ResponseHelper } from '../helper-functions/response.helpers';
import type { StorageUploadResult } from './storage.types';

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'pdf'];

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') ?? 'us-east-1';
    this.bucket =
      this.config.get<string>('AWS_S3_BUCKET') ||
      this.config.get<string>('AWS_S3_BUCKET_NAME_DEVELOPMENT') ||
      '';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  private validateFiles(files: Array<Express.Multer.File>): { filename: string; error: string }[] {
    const errors: { filename: string; error: string }[] = [];
    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_FORMATS.includes(ext)) {
        errors.push({
          filename: file.originalname,
          error: `Format not allowed. Allowed: ${ALLOWED_FORMATS.join(', ')}`,
        });
      }
    }
    return errors;
  }

  /**
   * Upload files to S3 under the given folder (key prefix).
   * Folder should not have leading/trailing slashes (e.g. "distribution/stocks").
   */
  async upload(
    files: Array<Express.Multer.File>,
    folder: string,
  ): Promise<StorageUploadResult[]> {
    this.logger.log(`Validating ${files.length} file(s) before S3 upload...`);
    const validationErrors = this.validateFiles(files);
    if (validationErrors.length > 0) {
      const msg = validationErrors.map((e) => `${e.filename}: ${e.error}`).join('\n');
      throw ResponseHelper.error('Invalid file format(s)', msg, 400);
    }

    const prefix = folder.replace(/^\/|\/$/g, '');
    const results: StorageUploadResult[] = [];

    for (const file of files) {
      const ext = file.originalname.split('.').pop() ?? 'bin';
      const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      this.logger.log(`Uploading to S3: ${key}`);

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      results.push({
        secure_url: url,
        public_id: key,
        original_filename: file.originalname,
      });
    }

    this.logger.log(`S3 upload complete: ${results.length} file(s)`);
    return results;
  }

  /**
   * Delete objects by key (public_id for S3 is the object key).
   */
  async delete(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.logger.log(`Deleting from S3: ${key}`);
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    }
    this.logger.log(`S3 delete complete: ${keys.length} object(s)`);
  }
}
