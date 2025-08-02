import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateBookDto, BookCategory, BookGenre, BookLanguage, BookFormat } from './dto/create-book.dto';
import { EditProductDTO } from './dto/edit-product.dto';
import * as csv from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { PRODUCT_VALIDATION_LIMITS, VALIDATION_MESSAGES } from './constants/validation-limits';
import { ProductResponseDto } from './dto/product-response.dto';
import { formatDate } from 'src/shared/helper-functions/formatter';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    
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
                        bookFormat: product.BookFormat,
                        categories: product.categories.map(c => ({ id: c.id, name: c.name })),
                        isbn: product.isbn || 'N/A',
                        sellingPrice: product.sellingPrice,
                        normalPrice: product.normalPrice,
                        referralCommission: product.commission ?? null,
                        stock: product.stock,
                        status: product.status,
                        isFeatured: product.isFeatured,
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
        format?: string,
    
    ) {
        this.logger.log('Fetching ALL product table data with filters...');

        // Log all search parameters
        this.logger.log(colors.cyan(`🔍 Search Parameters: name: ${search}, format: ${format}`));

        try {
            const skip = (page - 1) * limit;

            // Build comprehensive where clause for filtering
            const whereClause: any = {};

            // Search functionality - search only by product name
            if (search) {
                whereClause.name = { contains: search, mode: 'insensitive' as const };
            }

            // Format filtering
            if (format) {
                whereClause.BookFormat = format;
            }

            // Log the final where clause for debugging
            // this.logger.log('🔧 Final WHERE clause: ' + JSON.stringify(whereClause, null, 2));

            // Simple default sorting
            const orderBy = { createdAt: 'desc' as const };

            // Get dashboard cards data
            const [totalBooks, totalCategories, inStockCount, productsWithValue] = await Promise.all([
                this.prisma.product.count({ where: whereClause }),
                this.prisma.category.count(),
                this.prisma.product.count({ where: { ...whereClause, stock: { gt: 0 } } }),
                this.prisma.product.findMany({
                    where: whereClause,
                    select: { sellingPrice: true, stock: true }
                })
            ]);

            const totalProductValue = productsWithValue.reduce((total, product) => {
                return total + (product.sellingPrice * product.stock);
            }, 0);

            // Get products table data with pagination and filters
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    include: {
                        categories: { select: { id: true, name: true } },
                        formats: { select: { id: true, name: true } },
                    },
                    orderBy
                }),
                this.prisma.product.count({ where: whereClause })
            ]);

            const totalPages = Math.ceil(total / limit);

            this.logger.log(colors.green(`✅ Search completed: Found ${total} products (showing ${products.length} on page ${page}/${totalPages})`));
            
            // Log the found products for debugging
            if (search && products.length > 0) {
                // this.logger.log(`📋 Found products for search "${search}":`);
                products.forEach((product, index) => {
                    // this.logger.log(`  ${index + 1}. "${product.name}" (ID: ${product.id})`);
                });
            } else if (search && products.length === 0) {
                this.logger.log(`❌ No products found for search "${search}"`);
            }

            const dashboardData = {
                dashboardCards: {
                    totalBooks,
                    totalCategories,
                    inStock: inStockCount,
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
                        bookFormat: product.BookFormat,
                        categories: product.categories.map(c => ({ id: c.id, name: c.name })),
                        isbn: product.isbn || 'N/A',
                        sellingPrice: product.sellingPrice,
                        normalPrice: product.normalPrice,
                        referralCommission: product.commission ?? null,
                        stock: product.stock,
                        status: product.status,
                        isFeatured: product.isFeatured,
                        displayImages: product.displayImages || [],
                    })),
                    
                }
            };

            this.logger.log('Product dashboard data retrieved successfully');
            return new ApiResponse(true, "", dashboardData);

        } catch (error) {
            this.logger.error('Error fetching product dashboard:', error);
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
                format: [product.BookFormat],
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

        console.log(`[BulkImport] File received: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);

        let records;
        try {
            // Check if it's an Excel file
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.originalname.endsWith('.xlsx')) {
                console.log('[BulkImport] Processing as Excel file');
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                records = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Convert to CSV-like format
                if (records.length > 0) {
                    const headers = records[0];
                    records = records.slice(1).map(row => {
                        const obj: any = {};
                        headers.forEach((header: string, index: number) => {
                            obj[header] = row[index] || '';
                        });
                        return obj;
                    });
                }
            } else {
                // Process as CSV
                console.log('[BulkImport] Processing as CSV file');
                const fileContent = file.buffer.toString('utf8');
                console.log('[BulkImport] File content preview:', fileContent.substring(0, 500));
                
                records = csv.parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    relax_quotes: true,
                    relax_column_count: true
                });
            }
        } catch (err) {
            console.log('[BulkImport] CSV/Excel parsing error:', err);
            console.log('[BulkImport] Error details:', {
                message: err.message,
                stack: err.stack,
                fileSize: file.size,
                mimetype: file.mimetype,
                originalname: file.originalname
            });
            throw new BadRequestException(`Invalid file format. Please ensure it's a valid CSV or Excel file. Error: ${err.message}`);
        }

        console.log(`[BulkImport] Starting bulk import: ${records.length} rows`);
        if (records.length === 0) {
            console.log('[BulkImport] File is empty or has no data rows');
            return new ApiResponse(false, 'File is empty or has no data rows', { results: [], errors: [] });
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
                    bookId: row['ID'] ? String(row['ID']) : undefined,
                    sku: row['SKU'] ? String(row['SKU']) : undefined,
                    name: row['Name'],
                    isFeatured: row['Is featured?'] === '1',
                    author: row['Short description'] || undefined,
                    status: row['Visibility in catalog'] === 'active' ? 'active' : 'inactive',
                    description: row['Description'] || '',
                    inStock: row['In stock?'] === '1',
                    shortDescription: row['Short description'] || '',
                    taxStatus: row['Tax status'] || undefined,
                    stock: parseInt(row['Stock'] || row['total stock'] || '0', 100),
                    backorders: row['Backorders allowed?'] === '0',
                    soldIndividually: row['Sold individually?'] === '0',
                    weight: row['Weight (kg)'] ? parseFloat(row['Weight (kg)']) : undefined,
                    length: row['Length (cm)'] ? parseFloat(row['Length (cm)']) : undefined,
                    width: row['Width (cm)'] ? parseFloat(row['Width (cm)']) : undefined,
                    height: row['Height (cm)'] ? parseFloat(row['Height (cm)']) : undefined,
                    allowCustomerReview: row['Allow customer reviews?'] !== '0',
                    purchaseNote: row['Purchase note'] || undefined,
                    sellingPrice: row['Regular price'] && !isNaN(Number(row['Regular price'])) ? parseFloat(row['Regular price']) : 0,
                    normalPrice: row['Regular price'] && !isNaN(Number(row['Regular price']))
                                ? parseFloat(row['Regular price'])
                                : 0,
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

                // Formats: handle special logic for simple/downloadable types
                if (row['Type']) {
                    const formatTypes = row['Type'].split(',').map((f: string) => f.trim().toLowerCase()).filter(Boolean);
                    
                    // Create all formats in the database (including virtual)
                    const allFormatIds: string[] = [];
                    for (const formatName of formatTypes) {
                        let format = await this.prisma.format.findFirst({ where: { name: formatName } });
                        if (!format) {
                            format = await this.prisma.format.create({
                                data: {
                                    name: formatName,
                                    isActive: true,
                                }
                            });
                        }
                        allFormatIds.push(format.id);
                    }
                    
                    // Filter out 'virtual' and only process 'simple' and 'downloadable' for product creation
                    const validFormats = formatTypes.filter((type: string) => type === 'simple' || type === 'downloadable');
                    
                    // Map format types
                    const formatMappings: { [key: string]: string } = {
                        'simple': 'hardcopy',
                        'downloadable': 'ebook'
                    };
                    
                    const mappedFormats = validFormats.map(type => formatMappings[type] || type);
                    
                    // Determine product creation logic
                    const hasSimple = validFormats.includes('simple');
                    const hasDownloadable = validFormats.includes('downloadable');
                    
                    let productsToCreate: Array<{ name: string; formats: string[] }> = [];
                    
                    if (hasSimple && hasDownloadable) {
                        // Create two products
                        productsToCreate = [
                            { name: row['Name'], formats: ['hardcopy'] },
                            { name: `${row['Name']} [E-Book]`, formats: ['ebook'] }
                        ];
                    } else if (hasSimple) {
                        // Create one product without suffix (hardcopy)
                        productsToCreate = [
                            { name: row['Name'], formats: ['hardcopy'] }
                        ];
                    } else if (hasDownloadable) {
                        // Create one product with [E-Book] suffix
                        productsToCreate = [
                            { name: `${row['Name']} [E-Book]`, formats: ['ebook'] }
                        ];
                    }
                    
                    // Create products for each format combination
                    for (const productConfig of productsToCreate) {
                        const productData: any = {
                            bookId: row['ID'] ? String(row['ID']) : undefined,
                            sku: row['SKU'] ? String(row['SKU']) : undefined,
                            author: row['Short description'] || undefined,
                            name: productConfig.name,
                            isFeatured: row['Is featured?'] === '1',
                            stock: row['Stock'] ? parseInt(row['Stock']) : 100,
                            inStock: row['In stock?'] === '1',
                            backorders: row['Backorders allowed?'] === '0',
                            soldIndividually: row['Sold individually?'] === '0',
                            weight: row['Weight (kg)'] ? parseFloat(row['Weight (kg)']) : undefined,
                            length: row['Length (cm)'] ? parseFloat(row['Length (cm)']) : undefined,
                            width: row['Width (cm)'] ? parseFloat(row['Width (cm)']) : undefined,
                            height: row['Height (cm)'] ? parseFloat(row['Height (cm)']) : undefined,
                            description: row['Description'] || undefined,
                            sellingPrice: row['Regular price'] ? parseFloat(row['Regular price']) : undefined,
                            normalPrice: row['Regular price'] && !isNaN(Number(row['Regular price']))
                                ? parseFloat(row['Regular price'])
                                : 0,
                            commission: row['Commission'] ? parseFloat(row['Commission']) : undefined,
                            // stock: row['Stock'] ? parseInt(row['Stock']) : 10,
                            publishedDate: row['Published date'] ? new Date(row['Published date']) : undefined,
                            isActive: row['Active'] === 'true' || row['Active'] === '1',
                            storeId: defaultStoreId,
                            // ... rest of the fields
                        };

                        // Handle images
                        if (row['Images']) {
                            const imageUrls = row['Images']
                                .split(',')
                                .map((url: string) => url.trim())
                                .filter((url: string) => url.length > 0);
                            productData.displayImages = imageUrls;
                        }

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
                                }
                                categoryIds.push(category.id);
                            }
                            productData.categories = { connect: categoryIds.map(id => ({ id })) };
                        }

                        // Handle formats for this product (only the ones that should create products)
                        const formatIds: string[] = [];
                        for (const formatName of productConfig.formats) {
                            let format = await this.prisma.format.findFirst({ where: { name: formatName } });
                            if (!format) {
                                format = await this.prisma.format.create({
                                    data: {
                                        name: formatName,
                                        isActive: true,
                                    }
                                });
                            }
                            formatIds.push(format.id);
                        }
                        productData.formats = { connect: formatIds.map(id => ({ id })) };

                        // Create the product
                        const product = await this.prisma.product.create({
                            data: productData,
                            include: {
                                categories: true,
                                formats: true,
                            }
                        });
                        results.push(product);
                    }
                    
                    // Skip the rest of the loop since we've handled this row
                    continue;
                }
                
                // Handle rows without Type field (legacy format)
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

    async getProductsByCategoryName(categoryName: string, page: number = 1, limit: number = 20) {
        const Logger = (global as any).Logger || console;
        Logger.log(`[getProductsByCategoryName] Fetching products for category: ${categoryName}, page: ${page}, limit: ${limit}`);
        try {
            const skip = (page - 1) * limit;
            // Find the category by name (case-insensitive)
            const category = await this.prisma.category.findFirst({
                where: { name: { equals: categoryName, mode: 'insensitive' } },
            });
            if (!category) {
                throw new NotFoundException(`Category '${categoryName}' not found`);
            }
            // Find products for this category
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: {
                        categories: { some: { id: category.id } },
                        status: 'active',
                        isActive: true,
                    },
                    include: {
                        store: { select: { id: true, first_name: true, last_name: true, email: true } },
                        categories: { select: { id: true, name: true } },
                        languages: { select: { id: true, name: true } },
                        genres: { select: { id: true, name: true } },
                        formats: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.product.count({
                    where: {
                        categories: { some: { id: category.id } },
                        status: 'active',
                        isActive: true,
                    },
                }),
            ]);
            const totalPages = Math.ceil(total / limit);
            const formattedProducts: ProductResponseDto[] = products.map(product => ({
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
            }));
            return new ApiResponse(true, '', {
                products: formattedProducts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                },
            });
        } catch (error) {
            Logger.error(`[getProductsByCategoryName] Error:`, error);
            throw error;
        }
    }

     // Get product for edit with all available options
  async getProductForEdit(id: string): Promise<ApiResponse<any>> {
    this.logger.log(`Fetching product details for edit - ID: ${id}`);

    try {
      // Validate ID format
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('Invalid product ID provided');
      }

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
        this.logger.error(`Product with ID ${id} not found`);
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const formattedProductForEdit = {
        id: product.id,
        name: product.name,
        description: product.description,
        sellingPrice: product.sellingPrice,
        normalPrice: product.normalPrice,
        stock: product.stock,
        author: product.author,
        publisher: product.publisher,
        isbn: product.isbn,
        pages: product.pages,
        commission: product.commission,
        BookFormat: product.BookFormat,
        isActive: product.isActive,
        status: product.status,
        rated: product.rated,
        bookId: product.bookId,
        sku: product.sku,
        shortDescription: product.shortDescription,
        taxStatus: product.taxStatus,
        backorders: product.backorders,
        soldIndividually: product.soldIndividually,
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
        allowCustomerReview: product.allowCustomerReview,
        purchaseNote: product.purchaseNote,
        tags: product.tags,
        inStock: product.inStock,
        isFeatured: product.isFeatured,
        storeId: product.storeId,
        displayImages: product.displayImages || [],
        categories: product.categories.map(cat => ({ id: cat.id, name: cat.name })),
        formats: product.formats.map(format => ({ id: format.id, name: format.name })),
        genres: product.genres.map(genre => ({ id: genre.id, name: genre.name })),
        languages: product.languages.map(lang => ({ id: lang.id, name: lang.name })),
        publishedDate: product.publishedDate ? formatDate(product.publishedDate) : undefined,
        createdAt: formatDate(product.createdAt),
        updatedAt: formatDate(product.updatedAt),
      };

      // Available options for form fields
      const availableOptions = {
        BookFormat: ['audiobook', 'e_book', 'hardcover', 'paperback', 'hardcopy'],
        status: ['active', 'inactive', 'draft', 'archived'],
        isActive: [true, false],
        inStock: [true, false],
        isFeatured: [true, false],
        backorders: [true, false],
        soldIndividually: [true, false],
        allowCustomerReview: [true, false],
      };

      // Get all available categories, formats, genres, and languages
      const [categories, formats, genres, languages, stores] = await Promise.all([
        this.prisma.category.findMany({
          where: { isActive: true },
          select: { id: true, name: true, description: true }
        }),
        this.prisma.format.findMany({
          where: { isActive: true },
          select: { id: true, name: true, description: true }
        }),
        this.prisma.genre.findMany({
          where: { isActive: true },
          select: { id: true, name: true, description: true }
        }),
        this.prisma.language.findMany({
          where: { isActive: true },
          select: { id: true, name: true, description: true }
        }),
        this.prisma.store.findMany({
          where: { status: 'approved' },
          select: { id: true, first_name: true, last_name: true, email: true }
        })
      ]);

      const formatted_response = {
        availableOptions,
        categories,
        formats,
        genres,
        languages,
        stores,
        product: formattedProductForEdit,
      };

      this.logger.log(`Product details retrieved successfully for edit - ID: ${id}`);

      return new ApiResponse(
        true,
        "Product details retrieved successfully",
        formatted_response
      );

    } catch (error) {
      this.logger.error(`Error fetching product for edit with ID ${id}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to retrieve product details for edit');
    }
  }

  // Edit product
  async editProduct(id: string, dto: any, coverImages: Express.Multer.File[] = []): Promise<ApiResponse<any>> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    this.logger.log(`Editing product with ID: ${id}`);

    // Log incoming data from frontend (development only)
    if (isDevelopment) {
      this.logger.log(colors.cyan('📥 FRONTEND DATA RECEIVED:'));
      this.logger.log(colors.yellow('📋 DTO Data:'), JSON.stringify(dto, null, 2));
      this.logger.log(colors.yellow('📁 Files:'), coverImages ? `${coverImages.length} file(s)` : 'No files');
      
      if (coverImages && coverImages.length > 0) {
        coverImages.forEach((file, index) => {
          this.logger.log(colors.cyan(`  File ${index + 1}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`));
        });
      }
    }

    try {
      // Validate ID format
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('Invalid product ID provided');
      }

      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: {
          categories: { select: { id: true } },
          formats: { select: { id: true } },
          genres: { select: { id: true } },
          languages: { select: { id: true } },
        }
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Prepare update data - only include fields that are provided
      const updateData: any = {};
      const updatedFields: string[] = [];

      // Basic fields with minimal logging
      if (isDevelopment) {
        this.logger.log(colors.cyan('🔧 PROCESSING UPDATE FIELDS:'));
      }
      
      if (dto.name !== undefined) { updateData.name = dto.name; updatedFields.push('name'); if (isDevelopment) this.logger.log(colors.green(`  ✅ name: "${dto.name}"`)); }
      if (dto.description !== undefined) { updateData.description = dto.description; updatedFields.push('description'); if (isDevelopment) this.logger.log(colors.green(`  ✅ description: "${dto.description}"`)); }
      if (dto.sellingPrice !== undefined) { updateData.sellingPrice = dto.sellingPrice; updatedFields.push('sellingPrice'); if (isDevelopment) this.logger.log(colors.green(`  ✅ sellingPrice: ${dto.sellingPrice}`)); }
      if (dto.normalPrice !== undefined) { updateData.normalPrice = dto.normalPrice; updatedFields.push('normalPrice'); if (isDevelopment) this.logger.log(colors.green(`  ✅ normalPrice: ${dto.normalPrice}`)); }
      if (dto.stock !== undefined) { updateData.stock = dto.stock; updatedFields.push('stock'); if (isDevelopment) this.logger.log(colors.green(`  ✅ stock: ${dto.stock}`)); }
      if (dto.author !== undefined) { updateData.author = dto.author; updatedFields.push('author'); if (isDevelopment) this.logger.log(colors.green(`  ✅ author: "${dto.author}"`)); }
      if (dto.publisher !== undefined) { updateData.publisher = dto.publisher; updatedFields.push('publisher'); if (isDevelopment) this.logger.log(colors.green(`  ✅ publisher: "${dto.publisher}"`)); }
      if (dto.isbn !== undefined) { updateData.isbn = dto.isbn; updatedFields.push('isbn'); if (isDevelopment) this.logger.log(colors.green(`  ✅ isbn: "${dto.isbn}"`)); }
      if (dto.pages !== undefined) { updateData.pages = dto.pages; updatedFields.push('pages'); if (isDevelopment) this.logger.log(colors.green(`  ✅ pages: ${dto.pages}`)); }
      if (dto.commission !== undefined) { updateData.commission = dto.commission; updatedFields.push('commission'); if (isDevelopment) this.logger.log(colors.green(`  ✅ commission: ${dto.commission}`)); }
      if (dto.BookFormat !== undefined) { 
        updateData.BookFormat = dto.BookFormat; 
        updatedFields.push('BookFormat'); 
        if (isDevelopment) {
          this.logger.log(colors.green(`  ✅ BookFormat: "${dto.BookFormat}"`));
          this.logger.log(colors.yellow(`  🔍 BookFormat type: ${typeof dto.BookFormat}`));
          this.logger.log(colors.yellow(`  🔍 BookFormat value: ${JSON.stringify(dto.BookFormat)}`));
        }
      }
      if (dto.isActive !== undefined) { updateData.isActive = dto.isActive; updatedFields.push('isActive'); if (isDevelopment) this.logger.log(colors.green(`  ✅ isActive: ${dto.isActive}`)); }
      if (dto.status !== undefined) { updateData.status = dto.status; updatedFields.push('status'); if (isDevelopment) this.logger.log(colors.green(`  ✅ status: "${dto.status}"`)); }
      if (dto.rated !== undefined) { updateData.rated = dto.rated; updatedFields.push('rated'); if (isDevelopment) this.logger.log(colors.green(`  ✅ rated: "${dto.rated}"`)); }
      if (dto.bookId !== undefined) { updateData.bookId = dto.bookId; updatedFields.push('bookId'); if (isDevelopment) this.logger.log(colors.green(`  ✅ bookId: "${dto.bookId}"`)); }
      if (dto.sku !== undefined) { updateData.sku = dto.sku; updatedFields.push('sku'); if (isDevelopment) this.logger.log(colors.green(`  ✅ sku: "${dto.sku}"`)); }
      if (dto.shortDescription !== undefined) { updateData.shortDescription = dto.shortDescription; updatedFields.push('shortDescription'); if (isDevelopment) this.logger.log(colors.green(`  ✅ shortDescription: "${dto.shortDescription}"`)); }
      if (dto.taxStatus !== undefined) { updateData.taxStatus = dto.taxStatus; updatedFields.push('taxStatus'); if (isDevelopment) this.logger.log(colors.green(`  ✅ taxStatus: "${dto.taxStatus}"`)); }
      if (dto.backorders !== undefined) { updateData.backorders = dto.backorders; updatedFields.push('backorders'); if (isDevelopment) this.logger.log(colors.green(`  ✅ backorders: ${dto.backorders}`)); }
      if (dto.soldIndividually !== undefined) { updateData.soldIndividually = dto.soldIndividually; updatedFields.push('soldIndividually'); if (isDevelopment) this.logger.log(colors.green(`  ✅ soldIndividually: ${dto.soldIndividually}`)); }
      if (dto.weight !== undefined) { updateData.weight = dto.weight; updatedFields.push('weight'); if (isDevelopment) this.logger.log(colors.green(`  ✅ weight: ${dto.weight}`)); }
      if (dto.length !== undefined) { updateData.length = dto.length; updatedFields.push('length'); if (isDevelopment) this.logger.log(colors.green(`  ✅ length: ${dto.length}`)); }
      if (dto.width !== undefined) { updateData.width = dto.width; updatedFields.push('width'); if (isDevelopment) this.logger.log(colors.green(`  ✅ width: ${dto.width}`)); }
      if (dto.height !== undefined) { updateData.height = dto.height; updatedFields.push('height'); if (isDevelopment) this.logger.log(colors.green(`  ✅ height: ${dto.height}`)); }
      if (dto.allowCustomerReview !== undefined) { updateData.allowCustomerReview = dto.allowCustomerReview; updatedFields.push('allowCustomerReview'); if (isDevelopment) this.logger.log(colors.green(`  ✅ allowCustomerReview: ${dto.allowCustomerReview}`)); }
      if (dto.purchaseNote !== undefined) { updateData.purchaseNote = dto.purchaseNote; updatedFields.push('purchaseNote'); if (isDevelopment) this.logger.log(colors.green(`  ✅ purchaseNote: "${dto.purchaseNote}"`)); }
      if (dto.tags !== undefined) { updateData.tags = dto.tags; updatedFields.push('tags'); if (isDevelopment) this.logger.log(colors.green(`  ✅ tags: ${JSON.stringify(dto.tags)}`)); }
      if (dto.inStock !== undefined) { updateData.inStock = dto.inStock; updatedFields.push('inStock'); if (isDevelopment) this.logger.log(colors.green(`  ✅ inStock: ${dto.inStock}`)); }
      if (dto.isFeatured !== undefined) { updateData.isFeatured = dto.isFeatured; updatedFields.push('isFeatured'); if (isDevelopment) this.logger.log(colors.green(`  ✅ isFeatured: ${dto.isFeatured}`)); }
      if (dto.storeId !== undefined) { updateData.storeId = dto.storeId; updatedFields.push('storeId'); if (isDevelopment) this.logger.log(colors.green(`  ✅ storeId: "${dto.storeId}"`)); }
      if (dto.publishedDate !== undefined) { updateData.publishedDate = new Date(dto.publishedDate); updatedFields.push('publishedDate'); if (isDevelopment) this.logger.log(colors.green(`  ✅ publishedDate: "${dto.publishedDate}"`)); }

      if (isDevelopment) {
        this.logger.log(colors.magenta(`📊 Total fields to update: ${updatedFields.length}`));
        this.logger.log(colors.magenta(`📝 Fields: ${updatedFields.join(', ')}`));
      }

      // Handle image updates
      if (dto.imagesToDelete || dto.imageIndexesToDelete || (coverImages && coverImages.length > 0)) {
        this.logger.log(colors.cyan(`Starting image operations for product ${id}`));
        let currentImages: any[] = Array.isArray(existingProduct.displayImages) ? existingProduct.displayImages : [];
        this.logger.log(`Current images count: ${currentImages.length}`);
        
        // Delete images from Cloudinary by public_id
        if (dto.imagesToDelete && dto.imagesToDelete.length > 0) {
          this.logger.log(colors.yellow(`Attempting to delete ${dto.imagesToDelete.length} images from Cloudinary by public_id`));
          try {
            await this.cloudinaryService.deleteFromCloudinary(dto.imagesToDelete);
            this.logger.log(colors.green(`✅ Successfully deleted images from Cloudinary: ${dto.imagesToDelete.join(', ')}`));
          } catch (error) {
            this.logger.error(colors.red(`❌ Failed to delete images from Cloudinary: ${dto.imagesToDelete.join(', ')}`), error);
          }
          
          // Remove deleted images from current images array
          const beforeFilter = currentImages.length;
          currentImages = currentImages.filter(img => 
            img.public_id && !dto.imagesToDelete!.includes(img.public_id)
          );
          const afterFilter = currentImages.length;
          this.logger.log(`Removed ${beforeFilter - afterFilter} images from local array after Cloudinary deletion`);
        }
        
        // Delete images by index (for images without public_id)
        if (dto.imageIndexesToDelete && dto.imageIndexesToDelete.length > 0) {
          this.logger.log(colors.yellow(`Attempting to delete ${dto.imageIndexesToDelete.length} images by index: ${dto.imageIndexesToDelete.join(', ')}`));
          // Sort indexes in descending order to avoid shifting issues
          const sortedIndexes = dto.imageIndexesToDelete.sort((a, b) => b - a);
          
          for (const index of sortedIndexes) {
            if (index >= 0 && index < currentImages.length) {
              const imageToDelete = currentImages[index];
              this.logger.log(colors.cyan(`Processing image deletion at index ${index}: ${imageToDelete.secure_url}`));
              
              // If the image has a public_id, try to delete from Cloudinary
              if (imageToDelete.public_id) {
                this.logger.log(colors.cyan(`Image has public_id, attempting Cloudinary deletion: ${imageToDelete.public_id}`));
                try {
                  await this.cloudinaryService.deleteFromCloudinary([imageToDelete.public_id]);
                  this.logger.log(colors.green(`✅ Successfully deleted image from Cloudinary by index ${index}: ${imageToDelete.public_id}`));
                } catch (error) {
                  this.logger.error(colors.red(`❌ Failed to delete image from Cloudinary at index ${index}: ${imageToDelete.public_id}`), error);
                }
              } else {
                this.logger.log(colors.yellow(`Image at index ${index} has no public_id, skipping Cloudinary deletion`));
              }
              
              // Remove from array
              currentImages.splice(index, 1);
              this.logger.log(colors.green(`✅ Removed image at index ${index} from local array`));
            } else {
              this.logger.warn(colors.yellow(`⚠️ Invalid image index: ${index} (array length: ${currentImages.length})`));
            }
          }
        }
        
        // Handle uploaded files
        if (coverImages && coverImages.length > 0) {
          this.logger.log(`Starting file upload to Cloudinary: ${coverImages.length} file(s)`);
          for (let i = 0; i < coverImages.length; i++) {
            const file = coverImages[i];
            this.logger.log(`Uploading file ${i + 1}/${coverImages.length}: ${file.originalname} (${file.size} bytes)`);
          }
          
          try {
            const uploadResults = await this.cloudinaryService.uploadToCloudinary(
              coverImages,
              'acces-sellr/book-covers'
            );
            
            this.logger.log(`✅ Successfully uploaded ${uploadResults.length} files to Cloudinary`);
            
            const uploadedImages = uploadResults.map(res => ({
              secure_url: res.secure_url,
              public_id: res.public_id
            }));
            
            // Log each uploaded image
            for (let i = 0; i < uploadedImages.length; i++) {
              const img = uploadedImages[i];
              this.logger.log(`Uploaded image ${i + 1}: ${img.secure_url} (public_id: ${img.public_id})`);
            }
            
            // Add uploaded images to current images
            const beforeUpload = currentImages.length;
            currentImages = [...currentImages, ...uploadedImages];
            this.logger.log(`✅ Added ${uploadedImages.length} uploaded images. Total images: ${beforeUpload} → ${currentImages.length}`);
          } catch (error) {
            this.logger.error('❌ Failed to upload images to Cloudinary:', error);
          }
        }
        
        updateData.displayImages = currentImages;
        this.logger.log(`🎉 Image operations completed. Final image count: ${currentImages.length}`);
      }

      // Handle relationships with minimal logging
      if (isDevelopment) {
        this.logger.log(colors.cyan('🔗 PROCESSING RELATIONSHIP UPDATES:'));
      }
      const relationUpdates: any = {};
      const relationChanges: string[] = [];

      if (dto.categoryIds !== undefined) {
        relationUpdates.categories = {
          set: dto.categoryIds.map(catId => ({ id: catId }))
        };
        relationChanges.push('categories');
        if (isDevelopment) this.logger.log(colors.green(`  ✅ categories: ${JSON.stringify(dto.categoryIds)}`));
      }

      if (dto.formatIds !== undefined) {
        relationUpdates.formats = {
          set: dto.formatIds.map(formatId => ({ id: formatId }))
        };
        relationChanges.push('formats');
        if (isDevelopment) this.logger.log(colors.green(`  ✅ formats: ${JSON.stringify(dto.formatIds)}`));
      }

      if (dto.genreIds !== undefined) {
        relationUpdates.genres = {
          set: dto.genreIds.map(genreId => ({ id: genreId }))
        };
        relationChanges.push('genres');
        if (isDevelopment) this.logger.log(colors.green(`  ✅ genres: ${JSON.stringify(dto.genreIds)}`));
      }

      if (dto.languageIds !== undefined) {
        relationUpdates.languages = {
          set: dto.languageIds.map(langId => ({ id: langId }))
        };
        relationChanges.push('languages');
        if (isDevelopment) this.logger.log(colors.green(`  ✅ languages: ${JSON.stringify(dto.languageIds)}`));
      }

      if (isDevelopment) {
        this.logger.log(colors.magenta(`🔗 Total relationships to update: ${relationChanges.length}`));
        this.logger.log(colors.magenta(`🔗 Relationships: ${relationChanges.join(', ')}`));
      }

      // Update the product
      if (isDevelopment) {
        this.logger.log(colors.blue('💾 EXECUTING DATABASE UPDATE...'));
        this.logger.log(colors.yellow('📊 Update Summary:'));
        this.logger.log(colors.yellow(`  - Fields to update: ${updatedFields.length}`));
        this.logger.log(colors.yellow(`  - Relationships to update: ${relationChanges.length}`));
        this.logger.log(colors.yellow(`  - Files uploaded: ${coverImages ? coverImages.length : 0}`));
        this.logger.log(colors.cyan('🔍 Database update data:'), JSON.stringify(updateData, null, 2));
      }
      
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          ...relationUpdates
        },
        include: {
          store: { select: { id: true, first_name: true, last_name: true, email: true } },
          categories: { select: { id: true, name: true } },
          languages: { select: { id: true, name: true } },
          genres: { select: { id: true, name: true } },
          formats: { select: { id: true, name: true } },
        }
      });

      this.logger.log(`Product ${id} updated successfully`);
      if (isDevelopment) {
        this.logger.log(colors.cyan(`📝 Updated product name: "${updatedProduct.name}"`));
        this.logger.log(colors.cyan(`📝 Updated product BookFormat: "${updatedProduct.BookFormat}"`));
        this.logger.log(colors.cyan(`📝 Updated product data: ${JSON.stringify({
          id: updatedProduct.id,
          name: updatedProduct.name,
          BookFormat: updatedProduct.BookFormat,
          status: updatedProduct.status
        }, null, 2)}`));
      }

      return new ApiResponse(
        true,
        "Product updated successfully",
        {
          product: {
            id: updatedProduct.id,
            name: updatedProduct.name,
            description: updatedProduct.description,
            sellingPrice: updatedProduct.sellingPrice,
            normalPrice: updatedProduct.normalPrice,
            stock: updatedProduct.stock,
            author: updatedProduct.author,
            publisher: updatedProduct.publisher,
            isbn: updatedProduct.isbn,
            pages: updatedProduct.pages,
            commission: updatedProduct.commission,
            BookFormat: updatedProduct.BookFormat,
            isActive: updatedProduct.isActive,
            status: updatedProduct.status,
            rated: updatedProduct.rated,
            bookId: updatedProduct.bookId,
            sku: updatedProduct.sku,
            shortDescription: updatedProduct.shortDescription,
            taxStatus: updatedProduct.taxStatus,
            backorders: updatedProduct.backorders,
            soldIndividually: updatedProduct.soldIndividually,
            weight: updatedProduct.weight,
            length: updatedProduct.length,
            width: updatedProduct.width,
            height: updatedProduct.height,
            allowCustomerReview: updatedProduct.allowCustomerReview,
            purchaseNote: updatedProduct.purchaseNote,
            tags: updatedProduct.tags,
            inStock: updatedProduct.inStock,
            isFeatured: updatedProduct.isFeatured,
            storeId: updatedProduct.storeId,
            displayImages: updatedProduct.displayImages,
            categoryIds: updatedProduct.categories.map(cat => cat.id),
            formatIds: updatedProduct.formats.map(format => format.id),
            genreIds: updatedProduct.genres.map(genre => genre.id),
            languageIds: updatedProduct.languages.map(lang => lang.id),
            publishedDate: updatedProduct.publishedDate ? formatDate(updatedProduct.publishedDate) : undefined,
            createdAt: formatDate(updatedProduct.createdAt),
            updatedAt: formatDate(updatedProduct.updatedAt),
            store: updatedProduct.store ? {
              id: updatedProduct.store.id,
              name: updatedProduct.store.first_name + ' ' + updatedProduct.store.last_name,
              email: updatedProduct.store.email
            } : undefined,
            category: updatedProduct.categories && updatedProduct.categories[0] ? {
              id: updatedProduct.categories[0].id,
              name: updatedProduct.categories[0].name
            } : undefined
          },
          updatedFields: Object.keys(updateData),
          relationChanges: Object.keys(relationUpdates)
        }
      );

    } catch (error) {
      this.logger.error(`Error editing product with ID ${id}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update product');
    }
  }
}