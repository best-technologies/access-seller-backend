/**
 * Result shape returned by both Cloudinary and S3 uploads.
 * public_id is the storage identifier (Cloudinary public_id or S3 object key).
 */
export interface StorageUploadResult {
  secure_url: string;
  public_id: string;
  original_filename?: string;
}

/** Optional naming for uploaded objects (e.g. display-pic-abc12 under folder). */
export interface StorageUploadOptions {
  basenamePrefix?: string;
}
