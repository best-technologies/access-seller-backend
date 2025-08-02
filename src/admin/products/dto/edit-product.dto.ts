import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { BookFormat } from '@prisma/client';

export class EditProductDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    sellingPrice?: number;

    @IsOptional()
    @IsNumber()
    normalPrice?: number;

    @IsOptional()
    @IsNumber()
    stock?: number;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    publisher?: string;

    @IsOptional()
    @IsString()
    isbn?: string;

    @IsOptional()
    @IsNumber()
    pages?: number;

    @IsOptional()
    @IsString()
    commission?: string;

    @IsOptional()
    @IsEnum(BookFormat)
    BookFormat?: BookFormat;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    rated?: string;

    @IsOptional()
    @IsString()
    bookId?: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    shortDescription?: string;

    @IsOptional()
    @IsString()
    taxStatus?: string;

    @IsOptional()
    @IsBoolean()
    backorders?: boolean;

    @IsOptional()
    @IsBoolean()
    soldIndividually?: boolean;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsBoolean()
    allowCustomerReview?: boolean;

    @IsOptional()
    @IsString()
    purchaseNote?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsBoolean()
    inStock?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsString()
    storeId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categoryIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    formatIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    genreIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languageIds?: string[];

    @IsOptional()
    @IsString()
    publishedDate?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagesToDelete?: string[]; // Array of public_ids to delete from Cloudinary

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    imageIndexesToDelete?: number[]; // Array of indexes to delete from displayImages array

    // File upload related properties - these will be handled by the interceptor
    @IsOptional()
    coverImage?: any; // This will be populated by the FileInterceptor

    @IsOptional()
    files?: any; // For handling multiple files if needed

    // Allow any additional properties to prevent validation errors
    // This is especially important for multipart form data with files
    [key: string]: any;
} 