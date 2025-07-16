import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateBookDto, BookCategory, BookGenre, BookLanguage, BookFormat } from './dto/create-book.dto';
import * as csv from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { PRODUCT_VALIDATION_LIMITS, VALIDATION_MESSAGES } from './constants/validation-limits';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) {}

    async getProductDashboard(page: number = 1, limit: number = 10) {
        console.log(colors.cyan('Fetching product dashboard data...'));

        try {
            const skip = (page - 1) * limit;

            // Get dashboard cards data
            const [totalBooks, totalCategories, inStock, productsWithValue] = await Promise.all([
                this.prisma.product.count(),
                this.prisma.category.count(),
                this.prisma.product.count({ where: { stock: { gt: 0 } } }),
                this.prisma.product.findMany({
                    select: { sellingPrice: true, stock: true }
                })
            ]);

            const totalProductValue = productsWithValue.reduce((total, product) => {
                return total + (product.sellingPrice * product.stock);
            }, 0);

            // Get products table data with pagination
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    include: {
                        categories: { select: { id: true, name: true } },
                        formats: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.product.count()
            ]);

            const totalPages = Math.ceil(total / limit);

            const dashboardData = {
                dashboardCards: {
                    totalBooks,
                    totalCategories,
                    inStock,
                    totalProductValue: Math.round(totalProductValue * 100) / 100 // Round to 2 decimal places
                },
                productsTable: {
                    products: products.map(product => ({
                        id: product.id,
                        bookName: product.name,
                        publishedBy: product.publisher || 'N/A',
                        bookFormat: product.formats && product.formats.length > 0
                            ? product.formats.map(f => f.name).join(', ')
                            : 'N/A',
                        categories: product.categories.map(c => ({ id: c.id, name: c.name })),
                        isbn: product.isbn || 'N/A',
                        sellingPrice: product.sellingPrice,
                        normalPrice: product.normalPrice,
                        referralCommission: product.commission ?? null,
                        stock: product.stock,
                        status: product.status,
                        displayImages: product.displayImages || [],
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    }
                }
            };

            console.log(colors.magenta('Product dashboard data retrieved successfully'));
            return new ApiResponse(true, "", dashboardData);

        } catch (error) {
            console.log(colors.red('Error fetching product dashboard:'), error);
            throw error;
        }
    }

    ///////////////////////////////////////////// all products for product management page
    async adminGetAllProductDashboard(
        page: number = 1, 
        limit: number = 10, 
        search?: string,
        category?: string,
        status?: string,
        format?: string,
        publisher?: string,
        author?: string,
        minPrice?: number,
        maxPrice?: number,
        inStock?: boolean,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc'
    ) {
        console.log(colors.cyan('Fetching ALL product table data  with filters...'));

        try {
            const skip = (page - 1) * limit;

            // Get dashboard cards data
            const [totalBooks, totalCategories, inStock, productsWithValue] = await Promise.all([
                this.prisma.product.count(),
                this.prisma.category.count(),
                this.prisma.product.count({ where: { stock: { gt: 0 } } }),
                this.prisma.product.findMany({
                    select: { sellingPrice: true, stock: true }
                })
            ]);

            const totalProductValue = productsWithValue.reduce((total, product) => {
                return total + (product.sellingPrice * product.stock);
            }, 0);

            // Get products table data with pagination
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    include: {
                        categories: { select: { id: true, name: true } },
                        formats: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.product.count()
            ]);

            const totalPages = Math.ceil(total / limit);

            const dashboardData = {
                dashboardCards: {
                    totalBooks,
                    totalCategories,
                    inStock,
                    totalProductValue: Math.round(totalProductValue * 100) / 100 // Round to 2 decimal places
                },
                productsTable: {
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    products: products.map(product => ({
                        id: product.id,
                        bookName: product.name,
                        publishedBy: product.publisher || 'N/A',
                        bookFormat: product.formats && product.formats.length > 0
                            ? product.formats.map(f => f.name).join(', ')
                            : 'N/A',
                        categories: product.categories.map(c => ({ id: c.id, name: c.name })),
                        isbn: product.isbn || 'N/A',
                        sellingPrice: product.sellingPrice,
                        normalPrice: product.normalPrice,
                        referralCommission: product.commission ?? null,
                        stock: product.stock,
                        status: product.status,
                        displayImages: product.displayImages || [],
                    })),
                    
                }
            };

            console.log(colors.magenta('Product dashboard data retrieved successfully'));
            return new ApiResponse(true, "", dashboardData);

        } catch (error) {
            console.log(colors.red('Error fetching product dashboard:'), error);
            throw error;
        }
    }

    async getAllProducts(
        page: number = 1, 
        limit: number = 10, 
        search?: string,
        category?: string,
        status?: string,
        format?: string,
        publisher?: string,
        author?: string,
        minPrice?: number,
        maxPrice?: number,
        inStock?: boolean,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc'
    ) {
        console.log(colors.cyan('Fetching all products with filters...'));

        try {
            const skip = (page - 1) * limit;
            
            // Build comprehensive where clause
            const whereClause: any = {};

            // Search functionality - search across multiple fields
            if (search) {
                whereClause.OR = [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                    { store: { name: { contains: search, mode: 'insensitive' as const } } },
                    { isbn: { contains: search, mode: 'insensitive' as const } },
                    { author: { contains: search, mode: 'insensitive' as const } },
                    { publisher: { contains: search, mode: 'insensitive' as const } }
                ];
            }

            // Filter by category
            if (category) {
                whereClause.categories = { some: { id: category } };
            }

            // Filter by status
            if (status) {
                whereClause.status = status;
            }

            // Filter by format
            if (format) {
                // Remove or update this block, as filtering by many-to-many relation requires a different approach
                whereClause.formats = { some: { name: { contains: format, mode: 'insensitive' as const } } };
            }

            // Filter by publisher
            if (publisher) {
                whereClause.publisher = { contains: publisher, mode: 'insensitive' as const };
            }

            // Filter by author
            if (author) {
                whereClause.author = { contains: author, mode: 'insensitive' as const };
            }

            // Price range filter
            if (minPrice !== undefined || maxPrice !== undefined) {
                whereClause.price = {};
                if (minPrice !== undefined) {
                    whereClause.price.gte = minPrice;
                }
                if (maxPrice !== undefined) {
                    whereClause.price.lte = maxPrice;
                }
            }

            // Stock filter
            if (inStock !== undefined) {
                if (inStock) {
                    whereClause.stock = { gt: 0 };
                } else {
                    whereClause.stock = { lte: 0 };
                }
            }

            // Build order by clause
            let orderBy: any = { createdAt: 'desc' }; // default sorting
            if (sortBy) {
                orderBy = { [sortBy]: sortOrder || 'desc' };
            }

            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    include: {
                        store: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        },
                        categories: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        formats: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        languages: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        genres: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy
                }),
                this.prisma.product.count({ where: whereClause })
            ]);

            const totalPages = Math.ceil(total / limit);

            // Map categories to null if empty
            const formattedProducts = products.map(product => ({
                ...product,
                commission: product.commission ?? null,
                categories: product.categories && product.categories.length > 0 ? product.categories : null
            }));

            const formattedResponse = {
                products: formattedProducts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            };

            console.log(colors.magenta(`Products retrieved successfully. Page ${page} of ${totalPages}`));
            return new ApiResponse(true, "", formattedResponse);

        } catch (error) {
            console.log(colors.red('Error fetching products:'), error);
            throw error;
        }
    }

    async getProductById(id: string) {
        console.log(colors.cyan(`Fetching product with ID: ${id}`));

        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    store: { select: { id: true, first_name: true, last_name: true, email: true } },
                    categories: { select: { id: true, name: true } },
                    languages: { select: { id: true, name: true } },
                    genres: { select: { id: true, name: true } },
                    formats: { select: { id: true, name: true } },
                }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            // Map to ProductResponseDto
            const response: ProductResponseDto = {
                id: product.id,
                name: product.name,
                description: product.description ?? undefined,
                sellingPrice: product.sellingPrice,
                normalPrice: product.normalPrice,
                stock: product.stock,
                images: Array.isArray(product.displayImages) ? product.displayImages.map((img: any) => img.secure_url) : [],
                categoryId: product.categories && product.categories[0] ? product.categories[0].id : '',
                storeId: product.storeId ?? '',
                commission: product.commission ? Number(product.commission) : 0,
                isActive: product.isActive,
                status: product.status,
                isbn: product.isbn ?? undefined,
                format: product.formats ? product.formats.map(f => f.name) : [],
                publisher: product.publisher ?? undefined,
                author: product.author ?? undefined,
                pages: product.pages ?? undefined,
                language: product.languages ? product.languages.map(l => l.name) : [],
                genre: product.genres ? product.genres.map(g => g.name) : [],
                publishedDate: product.publishedDate ?? undefined,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                store: product.store ? {
                    id: product.store.id,
                    name: product.store.first_name + ' ' + product.store.last_name,
                    email: product.store.email
                } : undefined,
                category: product.categories && product.categories[0] ? {
                    id: product.categories[0].id,
                    name: product.categories[0].name
                } : undefined
            };

            console.log(colors.magenta('Product retrieved successfully'));
            return new ApiResponse(true, 'Product retrieved successfully', response);

        } catch (error) {
            console.log(colors.red('Error fetching product:'), error);
            throw error;
        }
    }

    async updateProductStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
        console.log(colors.cyan(`Updating product status to: ${status}`));

        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const updatedProduct = await this.prisma.product.update({
                where: { id },
                data: {
                    status,
                    categories: {
                        connect: product.categories.map(c => ({ id: c.id }))
                    }
                },
                include: {
                    store: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    },
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            console.log(colors.magenta(`Product status updated to: ${status}`));
            return new ApiResponse(true, "", updatedProduct);

        } catch (error) {
            console.log(colors.red('Error updating product status:'), error);
            throw error;
        }
    }

    async getProductsByStore(storeId: string, page: number = 1, limit: number = 10) {
        console.log(colors.cyan(`Fetching products for store: ${storeId}`));

        try {
            const skip = (page - 1) * limit;

            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: { storeId: storeId },
                    include: {
                        store: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        },
                        categories: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        formats: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        languages: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        genres: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.product.count({ where: { storeId: storeId } })
            ]);

            const totalPages = Math.ceil(total / limit);

            console.log(colors.magenta(`Store products retrieved successfully. Page ${page} of ${totalPages}`));
            return new ApiResponse(true, "", {
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            });

        } catch (error) {
            console.log(colors.red('Error fetching store products:'), error);
            throw error;
        }
    }

    async getFilterOptions() {
        console.log(colors.cyan('Fetching filter options...'));

        try {
            // Get all filter options in parallel for better performance
            const [formats, publishers, authors, categories] = await Promise.all([
                this.prisma.format.findMany({ select: { id: true, name: true } }),
                this.prisma.product.findMany({
                    where: { publisher: { not: null } },
                    select: { publisher: true },
                    distinct: ['publisher']
                }),
                this.prisma.product.findMany({
                    where: { author: { not: null } },
                    select: { author: true },
                    distinct: ['author']
                }),
                this.prisma.category.findMany({ select: { id: true, name: true } })
            ]);

            const filterOptions = {
                formats: formats.map(f => ({ id: f.id, name: f.name })),
                publishers: publishers.map(item => item.publisher).filter(Boolean),
                authors: authors.map(item => item.author).filter(Boolean),
                categories: categories.map(cat => ({ id: cat.id, name: cat.name })),
                statuses: ['active', 'inactive', 'suspended'],
                sortOptions: [
                    { value: 'name', label: 'Book Name' },
                    { value: 'price', label: 'Price' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'createdAt', label: 'Date Added' },
                    { value: 'author', label: 'Author' },
                    { value: 'publisher', label: 'Publisher' }
                ]
            };

            console.log(colors.magenta('Filter options retrieved successfully'));
            return new ApiResponse(true, "", filterOptions);

        } catch (error) {
            console.log(colors.red('Error fetching filter options:'), error);
            throw error;
        }
    }

    async getProductAnalytics() {
        console.log(colors.cyan('Fetching product analytics...'));
        
        try {
            const totalProducts = await this.prisma.product.count();
            const activeProducts = await this.prisma.product.count({
                where: { status: 'active' }
            });
            const inactiveProducts = await this.prisma.product.count({
                where: { status: 'inactive' }
            });
            const suspendedProducts = await this.prisma.product.count({
                where: { status: 'suspended' }
            });

            const analytics = {
                total: totalProducts,
                active: activeProducts,
                inactive: inactiveProducts,
                suspended: suspendedProducts,
                activePercentage: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0
            };

            console.log(colors.magenta('Product analytics retrieved successfully'));
            return new ApiResponse(true, "", analytics);

        } catch (error) {
            console.log(colors.red('Error fetching product analytics:'), error);
            throw error;
        }
    }

    async getValidationInfo() {
        console.log(colors.cyan('Fetching validation info...'));
        
        try {
            const validationInfo = {
                maxImagesPerBook: PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK,
                maxFileSizeMB: PRODUCT_VALIDATION_LIMITS.MAX_FILE_SIZE / (1024 * 1024),
                maxTotalFileSizeMB: PRODUCT_VALIDATION_LIMITS.MAX_TOTAL_FILE_SIZE / (1024 * 1024),
                allowedImageTypes: PRODUCT_VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES,
                maxNameLength: PRODUCT_VALIDATION_LIMITS.MAX_NAME_LENGTH,
                maxDescriptionLength: PRODUCT_VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH,
                maxPublisherLength: PRODUCT_VALIDATION_LIMITS.MAX_PUBLISHER_LENGTH,
                maxIsbnLength: PRODUCT_VALIDATION_LIMITS.MAX_ISBN_LENGTH,
                maxRatedLength: PRODUCT_VALIDATION_LIMITS.MAX_RATED_LENGTH,
                minPrice: PRODUCT_VALIDATION_LIMITS.MIN_PRICE,
                maxPrice: PRODUCT_VALIDATION_LIMITS.MAX_PRICE,
                minStock: PRODUCT_VALIDATION_LIMITS.MIN_STOCK,
                maxStock: PRODUCT_VALIDATION_LIMITS.MAX_STOCK
            };

            console.log(colors.magenta('Validation info retrieved successfully'));
            return new ApiResponse(true, "", validationInfo);

        } catch (error) {
            console.log(colors.red('Error fetching validation info:'), error);
            throw error;
        }
    }

    public validateUploadedFiles(files: Record<string, Express.Multer.File[]>) {
        if (!files || Object.keys(files).length === 0) {
            return; // No files uploaded, which is fine
        }

        let totalFileSize = 0;
        let imageCount = 0;

        // Process each uploaded file
        Object.keys(files).forEach(imageKey => {
            const match = imageKey.match(/display_images\[(\d+)\]/);
            if (match && files[imageKey] && files[imageKey].length > 0) {
                const imageIndex = parseInt(match[1], 10);
                const file = files[imageKey][0];
                
                // Validate file type
                if (!PRODUCT_VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
                    throw new BadRequestException(`File ${file.originalname}: ${VALIDATION_MESSAGES.INVALID_FILE_TYPE}`);
                }

                // Validate file size
                if (file.size > PRODUCT_VALIDATION_LIMITS.MAX_FILE_SIZE) {
                    throw new BadRequestException(`File ${file.originalname}: ${VALIDATION_MESSAGES.FILE_TOO_LARGE}`);
                }

                // Track total file size
                totalFileSize += file.size;
                imageCount++;
            }
        });

        // Validate total file size
        if (totalFileSize > PRODUCT_VALIDATION_LIMITS.MAX_TOTAL_FILE_SIZE) {
            throw new BadRequestException(VALIDATION_MESSAGES.TOTAL_FILE_SIZE_EXCEEDED);
        }

        // Validate total number of images
        if (imageCount > PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK) {
            throw new BadRequestException(VALIDATION_MESSAGES.TOO_MANY_IMAGES);
        }

        console.log(`File validation passed. Total files: ${imageCount}, Total size: ${totalFileSize} bytes`);
    }

    async addBook(book: CreateBookDto, coverImages: Express.Multer.File[]) {
        console.log(colors.cyan(`Admin attempting to add book: ${JSON.stringify(book)}`))
       
        // Check for duplicate ISBN
        if (book.isbn) {
            const existingBook = await this.prisma.product.findUnique({
                where: { isbn: book.isbn },
                select: { isbn: true }
            });
            if (existingBook) {
                console.log(colors.red(`Duplicate ISBN found: ${book.isbn}`))
                throw new BadRequestException(`Duplicate ISBN found: ${book.isbn}`);
            }
        }

        try {
            console.log(colors.yellow(`Processing book: ${book.name}`));
            let displayImages: any[] = [];
            
            // If coverImages are provided, upload them
            if (coverImages && coverImages.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadToCloudinary(
                    coverImages.filter(img => img), // Filter out undefined entries
                    'acces-sellr/book-covers'
                );
                displayImages = uploadResults.map(res => ({
                    secure_url: res.secure_url,
                    public_id: res.public_id
                }));
            } else if (book.coverImage && typeof book.coverImage === 'string' && book.coverImage.startsWith('http')) {
                // If already a URL, just use it
                displayImages = [{ secure_url: book.coverImage, public_id: null }];
            }
            
            // Accept both categoryIds and categories as optional
            let rawCategories = (book as any).categories;
            if (typeof rawCategories === 'string') {
                try {
                    rawCategories = JSON.parse(rawCategories);
                } catch {
                    rawCategories = undefined;
                }
            }
            
            // Handle categoryIds - can be string, array, JSON stringified array, or undefined
            let categoryIds: string[] | undefined;
            if (Array.isArray(book.categoryIds) && book.categoryIds.length > 0) {
                categoryIds = book.categoryIds;
            } else if (typeof book.categoryIds === 'string') {
                // Try to parse as JSON first (for JSON stringified arrays)
                try {
                    const parsed = JSON.parse(book.categoryIds);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        categoryIds = parsed;
                    } else if (typeof parsed === 'string' && parsed.trim()) {
                        categoryIds = [parsed.trim()];
                    }
                } catch {
                    // If JSON parsing fails, treat as single string
                    if ((book.categoryIds as string).trim()) {
                        categoryIds = [(book.categoryIds as string).trim()];
                    }
                }
            } else if (Array.isArray(rawCategories) && rawCategories.length > 0) {
                categoryIds = rawCategories;
            }

             // Accept both formatIds and formats as optional
             let rawFormats = (book as any).formats;
             if (typeof rawFormats === 'string') {
                 try {
                    rawFormats = JSON.parse(rawFormats);
                 } catch {
                    rawFormats = undefined;
                 }
             }
             
             // Handle formatIds - can be string, array, JSON stringified array, or undefined
             let formatIds: string[] | undefined;
             if (Array.isArray(book.formatIds) && book.formatIds.length > 0) {
                 formatIds = book.formatIds;
             } else if (typeof book.formatIds === 'string') {
                 // Try to parse as JSON first (for JSON stringified arrays)
                 try {
                     const parsed = JSON.parse(book.formatIds);
                     if (Array.isArray(parsed) && parsed.length > 0) {
                         formatIds = parsed;
                     } else if (typeof parsed === 'string' && parsed.trim()) {
                         formatIds = [parsed.trim()];
                     }
                 } catch {
                     // If JSON parsing fails, treat as single string
                     if ((book.formatIds as string).trim()) {
                         formatIds = [(book.formatIds as string).trim()];
                     }
                 }
             } else if (Array.isArray(rawFormats) && rawFormats.length > 0) {
                 formatIds = rawFormats;
             }

                 // Accept both languageIds and languages as optional
                let rawLanguages = (book as any).languages;
                if (typeof rawLanguages === 'string') {
                    try {
                        rawLanguages = JSON.parse(rawLanguages);
                    } catch {
                        rawLanguages = undefined;
                    }
                }
                
                // Handle languageIds - can be string, array, JSON stringified array, or undefined
                let languageIds: string[] | undefined;
                if (Array.isArray(book.languageIds) && book.languageIds.length > 0) {
                    languageIds = book.languageIds;
                } else if (typeof book.languageIds === 'string') {
                    // Try to parse as JSON first (for JSON stringified arrays)
                    try {
                        const parsed = JSON.parse(book.languageIds);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            languageIds = parsed;
                        } else if (typeof parsed === 'string' && parsed.trim()) {
                            languageIds = [parsed.trim()];
                        }
                    } catch {
                        // If JSON parsing fails, treat as single string
                        if ((book.languageIds as string).trim()) {
                            languageIds = [(book.languageIds as string).trim()];
                        }
                    }
                } else if (Array.isArray(rawLanguages) && rawLanguages.length > 0) {
                    languageIds = rawLanguages;
                }

                    // genres
                    let rawGenres = (book as any).genres;
                    if (typeof rawGenres === 'string') {
                        try {
                            rawGenres = JSON.parse(rawGenres);
                        } catch {
                            rawGenres = undefined;
                        }
                    }
                    
                    // Handle genreIds - can be string, array, JSON stringified array, or undefined
                    let genreIds: string[] | undefined;
                    if (Array.isArray(book.genreIds) && book.genreIds.length > 0) {
                        genreIds = book.genreIds;
                    } else if (typeof book.genreIds === 'string') {
                        // Try to parse as JSON first (for JSON stringified arrays)
                        try {
                            const parsed = JSON.parse(book.genreIds);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                genreIds = parsed;
                            } else if (typeof parsed === 'string' && parsed.trim()) {
                                genreIds = [parsed.trim()];
                            }
                        } catch {
                            // If JSON parsing fails, treat as single string
                            if ((book.genreIds as string).trim()) {
                                genreIds = [(book.genreIds as string).trim()];
                            }
                        }
                    } else if (Array.isArray(rawGenres) && rawGenres.length > 0) {
                        genreIds = rawGenres;
                    }

            


            if (categoryIds && categoryIds.length > 0) {
                const foundCategories = await this.prisma.category.findMany({
                    where: { id: { in: categoryIds } },
                    select: { id: true }
                });
                const foundIds = foundCategories.map(cat => cat.id);
                const missingIds = categoryIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    throw new BadRequestException(`Invalid category ID(s): ${missingIds.join(', ')}`);
                }
            }

            const safeLanguageIds = Array.isArray(languageIds) ? languageIds : [];
            const safeGenreIds = Array.isArray(genreIds) ? genreIds : [];
            const safeFormatIds = Array.isArray(formatIds) ? formatIds : [];

            // Existence check for language, genre, and format if they look like IDs (cuid)
            if (safeLanguageIds.length > 0) {
                const foundLanguages = await this.prisma.language.findMany({
                    where: { id: { in: safeLanguageIds } },
                    select: { id: true }
                });
                const foundIds = foundLanguages.map(cat => cat.id);
                const missingIds = safeLanguageIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    console.log(colors.red(`Invalid language ID(s): ${missingIds.join(', ')}`))
                    throw new BadRequestException(`Invalid language ID(s): ${missingIds.join(', ')}`);
                }
            }
            if (safeGenreIds.length > 0) {
                const foundGenres = await this.prisma.genre.findMany({
                    where: { id: { in: safeGenreIds } },
                    select: { id: true }
                });
                const foundIds = foundGenres.map(cat => cat.id);
                const missingIds = safeGenreIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    console.log(colors.red(`Invalid genre ID(s): ${missingIds.join(', ')}`))
                    throw new BadRequestException(`Invalid genre ID(s): ${missingIds.join(', ')}`);
                }
            }
            if (safeFormatIds.length > 0) {
                const foundFormats = await this.prisma.format.findMany({
                    where: { id: { in: safeFormatIds } },
                    select: { id: true }
                });
                const foundIds = foundFormats.map(cat => cat.id);
                const missingIds = safeFormatIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    console.log(colors.red(`Invalid format ID(s): ${missingIds.join(', ')}`))
                    throw new BadRequestException(`Invalid format ID(s): ${missingIds.join(', ')}`);
                }
            }

            const bookData: any = {
                name: book.name, 
                description: book.description,
                stock: Number(book.qty),
                sellingPrice: Number(book.sellingPrice),
                normalPrice: Number(book.normalPrice),
                commission: book.commission,
                // BookFormat: formatIds[0] ?? undefined,
                rated: book.rated,
                isbn: book.isbn,
                publisher: book.publisher,
                storeId: null, // TODO: Set default storeId
                displayImages: displayImages,
                isActive: true,
                status: 'active',
                ...(categoryIds ? { categories: { connect: categoryIds.map((id: string) => ({ id })) } } : {}),
                ...(safeLanguageIds.length ? { languages: { connect: safeLanguageIds.map((id: string) => ({ id })) } } : {}),
                ...(safeGenreIds.length ? { genres: { connect: safeGenreIds.map((id: string) => ({ id })) } } : {}),
                ...(safeFormatIds.length ? { formats: { connect: safeFormatIds.map((id: string) => ({ id })) } } : {}),
            };
            
            console.log(colors.green(`Book data prepared for: ${book.name}`));
            console.log(colors.yellow(`Category IDs: ${JSON.stringify(categoryIds)}`));
            console.log(colors.yellow(`Language IDs: ${JSON.stringify(languageIds)}`));
            console.log(colors.yellow(`Format IDs: ${JSON.stringify(formatIds)}`));
            console.log(colors.yellow(`Genre IDs: ${JSON.stringify(genreIds)}`));
            
            const createdBook = await this.prisma.product.create({
                data: bookData,
                include: {
                    categories: { select: { id: true, name: true } },
                    languages: { select: { id: true, name: true } },
                    genres: { select: { id: true, name: true } },
                    formats: { select: { id: true, name: true } },
                }
            });
            
            console.log(colors.green(`Book created successfully: ${createdBook.id}`));
            console.log(colors.magenta(`Successfully added book: ${book.name}`));
            console.log(colors.magenta(`Successfully added book category: ${book.categoryIds}`));
            
            return new ApiResponse(true, `Successfully added book: ${book.name}`, {
                book: createdBook
            });
            
        } catch (error) {
            console.log(colors.red('Error adding book:'), error);
            throw new BadRequestException('Failed to add book: ' + error.message);
        }
    }

    async addBooksFromFile(file: Express.Multer.File) {
        if (!file) {
            console.log('[BulkImport] No file uploaded');
            throw new BadRequestException('No file uploaded');
        }
        let records;
        try {
            records = csv.parse(file.buffer.toString(), {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } catch (err) {
            console.log('[BulkImport] Invalid CSV file');
            throw new BadRequestException('Invalid CSV file');
        }
        console.log(`[BulkImport] Starting bulk import: ${records.length} rows`);
        if (records.length === 0) {
            console.log('[BulkImport] CSV file is empty');
            return new ApiResponse(false, 'CSV file is empty', { results: [], errors: [] });
        }
        // Log first 5 rows for debugging
        records.slice(0, 5).forEach((row, idx) => {
            console.log(`[BulkImport] Row ${idx + 1}:`, row);
        });
        const results: any[] = [];
        const errors: any[] = [];
        // Get a default storeId for new categories (first store in db)
        const defaultStore = await this.prisma.store.findFirst();
        const defaultStoreId = defaultStore ? defaultStore.id : undefined;
        if (!defaultStoreId) {
            throw new BadRequestException('No store found in the database to attach new categories.');
        }
        for (const [i, row] of records.entries()) {
            try {
                // Map CSV columns to Product fields
                const productData: any = {
                    bookId: row['bookId'] || undefined,
                    sku: row['SKU'] || undefined,
                    name: row['Name'],
                    isFeatured: row['Is featured?'] === '1',
                    status: row['Visibility in catalog'] === 'active' ? 'active' : 'inactive',
                    description: row['Description'] || '',
                    shortDescription: row['Short description'] || '',
                    taxStatus: row['Tax status'] || undefined,
                    stock: parseInt(row['Stock'] || row['total stock'] || '0', 10),
                    backorders: row['Backorders allowed?'] === '1',
                    soldIndividually: row['Sold individually?'] === '1',
                    weight: row['Weight (kg)'] ? parseFloat(row['Weight (kg)']) : undefined,
                    length: row['Length (cm)'] ? parseFloat(row['Length (cm)']) : undefined,
                    width: row['Width (cm)'] ? parseFloat(row['Width (cm)']) : undefined,
                    height: row['Height (cm)'] ? parseFloat(row['Height (cm)']) : undefined,
                    allowCustomerReview: row['Allow customer reviews?'] !== '0',
                    purchaseNote: row['Purchase note'] || undefined,
                    sellingPrice: parseFloat(row['Sale price'] || row['selling price'] || '0'),
                    normalPrice: parseFloat(row['Regular price'] || row['normal price'] || '0'),
                    tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
                    // Handle multiple images
                    displayImages: row['Images'] ? row['Images']
                        .split(',')
                        .map((url: string) => url.trim())
                        .filter((url: string) => url.length > 0)
                        .map(url => ({ secure_url: url, public_id: null })) : [],
                };
                // Categories: resolve by name (assume comma-separated), create if missing
                if (row['Categories']) {
                    const categoryNames = row['Categories'].split(',').map((c: string) => c.trim()).filter(Boolean);
                    const categoryIds: string[] = [];
                    for (const name of categoryNames) {
                        let category = await this.prisma.category.findFirst({ where: { name } });
                        if (!category) {
                            category = await this.prisma.category.create({
                                data: {
                                    name,
                                    storeId: defaultStoreId,
                                    isActive: true,
                                }
                            });
                            console.log(`[BulkImport] Created new category: ${name}`);
                        }
                        categoryIds.push(category.id);
                    }
                    if (categoryIds.length) {
                        productData.categories = { connect: categoryIds.map(id => ({ id })) };
                    }
                }
                // Save product
                const created = await this.prisma.product.create({ data: productData });
                results.push({ row: i + 1, id: created.id });
                if ((i + 1) % 100 === 0) {
                    console.log(`[BulkImport] Processed ${i + 1} rows`);
                }
            } catch (err) {
                errors.push({ row: i + 1, error: err.message });
                console.log(`[BulkImport] Error on row ${i + 1}: ${err.message}`);
            }
        }
        console.log(`[BulkImport] Completed: ${results.length} succeeded, ${errors.length} failed.`);
        return new ApiResponse(true, `Bulk import completed: ${results.length} succeeded, ${errors.length} failed.`, { results, errors });
    }

    async getProductsWithCommission(page: number = 1, limit: number = 10) {
        console.log(colors.cyan('Fetching products with commission > 0...'));
        const skip = (page - 1) * limit;
        // Prisma does not support direct numeric comparison on string fields, so filter in JS after query
        const products = await this.prisma.product.findMany({
            skip,
            take: limit,
            where: {
                commission: { not: null },
            },
            include: {
                categories: { select: { id: true, name: true } },
                formats: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' }
        });
        // Filter products with commission > 0
        const filtered = products.filter(p => {
            const num = Number(p.commission);
            return !isNaN(num) && num > 0;
        });
        // Map to ProductResponseDto
        const result = filtered.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description ?? undefined,
            sellingPrice: product.sellingPrice,
            normalPrice: product.normalPrice,
            stock: product.stock,
            images: Array.isArray(product.displayImages) ? product.displayImages.map((img: any) => img.secure_url) : [],
            categoryId: product.categories && product.categories[0] ? product.categories[0].id : '',
            storeId: product.storeId ?? '',
            commission: product.commission ? Number(product.commission) : 0,
            isActive: product.isActive,
            status: product.status,
            isbn: product.isbn ?? undefined,
            format: product.formats ? product.formats.map(f => f.name) : [],
            publisher: product.publisher ?? undefined,
            author: product.author ?? undefined,
            pages: product.pages ?? undefined,
            language: [], // Not included in this query
            genre: [], // Not included in this query
            publishedDate: product.publishedDate ?? undefined,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            store: undefined,
            category: product.categories && product.categories[0] ? {
                id: product.categories[0].id,
                name: product.categories[0].name
            } : undefined
        }));
        return new ApiResponse(true, 'Products with commission > 0 fetched', {
            products: result,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(filtered.length / limit),
                totalItems: filtered.length,
                itemsPerPage: limit
            }
        });
    }
} 