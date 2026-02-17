import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { S3Service } from './services/s3.service';
import { StorageService } from './services/storage.service';

@Module({
  providers: [CloudinaryService, S3Service, StorageService],
  exports: [CloudinaryService, S3Service, StorageService],
})
export class SharedModule {} 