import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private prisma: PrismaService) {}

  private formatProduct(product: any) {
    let displayImageUrl: string | null = null;
    if (product.displayImages) {
      let images = product.displayImages;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }
      if (Array.isArray(images) && images.length > 0) {
        const firstImage = images[0];
        if (firstImage && typeof firstImage === 'object' && 'secure_url' in firstImage && typeof firstImage.secure_url === 'string') {
          displayImageUrl = firstImage.secure_url;
        }
      }
    }
    return {
      id: product.id,
      book_name: product.name,
      author: product.author ?? 'N/A',
      description: product.description ?? '',
      selling_price: product.sellingPrice,
      normal_price: product.normalPrice,
      total_purchase: 0, // fallback for now
      category: product.categories && product.categories.length > 0
        ? [product.categories[0]]
        : [],
      display_image: displayImageUrl,
      format: product.BookFormat,
    };
  }

  // Fisher-Yates shuffle
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async getAllPublicProductsSections() {
    this.logger.log("fetching all products from db for homepage (sections)");

    // Featured
    const featured = await this.prisma.product.findMany({
      where: { isFeatured: true },
      include: { categories: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const shuffledFeatured = this.shuffleArray([...featured]);

    // Extract unique categories from featured products
    const availableCategories = new Map();
    shuffledFeatured.forEach(product => {
      product.categories.forEach(category => {
        if (!availableCategories.has(category.id)) {
          availableCategories.set(category.id, category);
        }
      });
    });

    // New Arrivals: last 10 products added
    const newArrivals = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        formats: { select: { name: true } },
        categories: { select: { name: true } },
      },
    });
    const shuffledNewArrivals = this.shuffleArray([...newArrivals]);

    // Popular Categories (top 4 by product count)
    const popularCategories = await this.prisma.category.findMany({
      orderBy: { products: { _count: 'desc' } },
      take: 10,
      include: {
        products: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { displayImages: true },
        },
        _count: { select: { products: true } },
      },
    });

    const formated_response = {
      featured: shuffledFeatured.map(this.formatProduct),
      available_categories: Array.from(availableCategories.values()),
      newArrivals: shuffledNewArrivals.map(this.formatProduct),
      popularCategories: popularCategories.map(cat => {
        let displayImageUrl: string | null = null;
        if (cat.products[0]?.displayImages) {
          let images = cat.products[0].displayImages;
          if (typeof images === 'string') {
            try {
              images = JSON.parse(images);
            } catch {
              images = [];
            }
          }
          if (Array.isArray(images) && images.length > 0) {
            const firstImage = images[0];
            if (firstImage && typeof firstImage === 'object' && 'secure_url' in firstImage && typeof firstImage.secure_url === 'string') {
              displayImageUrl = firstImage.secure_url;
            }
          }
        }
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description ?? '',
          total_books: cat._count.products,
          display_image: displayImageUrl,
        };
      }),
    };

    this.logger.log("All products fetched successfully")
    return new ApiResponse(true, "Homepage data fetched", formated_response);
  }

  // Keep the original endpoint for backwards compatibility
  async getAllPublicProducts() {
    this.logger.log("fetching all products from db");
    const products = await this.prisma.product.findMany({
      include: {
        categories: { select: { id: true, name: true } },
      },
    });
    return products.map(this.formatProduct);
  }

  // Fetch products with pagination for browse products page (infinite scroll)
  async getPaginatedProducts(page: number = 1) {

    this.logger.log(`fetching products from db for browse all products page, page: ${page}`)

    try {
      const CATEGORIES_PER_PAGE = 20;
      const PRODUCTS_PER_CATEGORY = 10;
      const categoryOffset = (page - 1) * CATEGORIES_PER_PAGE;
      
      // Get categories with product count, ordered by product count descending
      const available_categories = await this.prisma.category.findMany({
        where: {
          products: {
            some: {}
          }
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        skip: categoryOffset,
        take: CATEGORIES_PER_PAGE
      });

      // For each category in this page, fetch up to 10 products
      const categoriesWithProducts = await Promise.all(
        available_categories.map(async (cat) => {
          const products = await this.prisma.product.findMany({
            where: {
              categories: {
                some: { id: cat.id }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: PRODUCTS_PER_CATEGORY,
            include: {
              categories: { select: { id: true, name: true } },
              formats: { select: { id: true, name: true } },
            }
          });
          return {
            id: cat.id,
            name: cat.name,
            productCount: cat._count.products,
            products
          };
        })
      );

      // Flatten all products from all categories
      const allProducts = categoriesWithProducts.flatMap(cat => cat.products);
      // Shuffle all products for randomness
      const shuffledAllProducts = this.shuffleArray([...allProducts]);

      // Get total categories count for pagination
      const totalCategories = await this.prisma.category.count({
        where: {
          products: {
            some: {}
          }
        }
      });

      const totalPages = Math.ceil(totalCategories / CATEGORIES_PER_PAGE);

      const available_formats = await this.prisma.format.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        }
      });

      const formatted_categories = [
        {
          id: 'all',
          name: 'All Books',
          total_books: totalCategories,
          icon: 'BookOpen'
        },
        ...categoriesWithProducts.map(cat => ({
          id: cat.id,
          name: cat.name,
          total_books: cat.productCount,
        }))
      ];

      const formatted_formats = available_formats.map(format => ({
        id: format.id,
        name: format.name,
        total_books: format._count.products
      }));

      const formattedProducts = await Promise.all(shuffledAllProducts.map(async (product) => {
        // Check if product was created within the last 48 hours
        const createdAt = new Date(product.createdAt);
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const isNew = diffInMs <= 48 * 60 * 60 * 1000; // 48 hours in ms
        let images = product.displayImages;
        if (typeof images === 'string') {
          try { images = JSON.parse(images); } catch { images = []; }
        }
        const display_picture = Array.isArray(images) && images[0] && typeof images[0] === 'object' && 'secure_url' in images[0]
          ? images[0].secure_url
          : null;
        // Get total sold for this product
        const orderItemsAgg = await this.prisma.orderItem.aggregate({
          where: { productId: product.id },
          _sum: { quantity: true },
        });
        const totalSold = orderItemsAgg._sum.quantity || 0;
        return {
          id: product.id,
          product_name: product.name,
          is_new: isNew,
          stock_count: product.stock,
          categories: Array.isArray(product.categories)
            ? product.categories.map((cat: any) => ({ id: cat.id, name: cat.name }))
            : [],
          book_format: product.BookFormat,
          stock_status: product.stock < 1 ? "Out Of Stock" : product.stock <= 30 ? "Low Stock" : "In Stock",
          display_picture: display_picture,
          author: product.author || product.publisher || null,
          total_sold: totalSold,
          selling_price: product.sellingPrice,
          nomral_price: product.normalPrice,
          format: product.BookFormat,

        };
      }));

      // Group products by category
      const productsByCategory = categoriesWithProducts.map(category => ({
        categoryName: category.name,
        totalCount: category.products.length, // Show actual count of products returned
        products: this.shuffleArray([...category.products]).map(product => {
          const createdAt = new Date(product.createdAt);
          const now = new Date();
          const diffInMs = now.getTime() - createdAt.getTime();
          const isNew = diffInMs <= 48 * 60 * 60 * 1000;
          let images = product.displayImages;
          if (typeof images === 'string') {
            try { images = JSON.parse(images); } catch { images = []; }
          }
          const display_picture = Array.isArray(images) && images[0] && typeof images[0] === 'object' && 'secure_url' in images[0]
            ? images[0].secure_url
            : null;
          return {
            id: product.id,
            product_name: product.name,
            is_new: isNew,
            stock_count: product.stock,
            categories: Array.isArray(product.categories)
              ? product.categories.map((cat: any) => ({ id: cat.id, name: cat.name }))
              : [],
            book_format: product.BookFormat,
            stock_status: product.stock < 1 ? "Out Of Stock" : product.stock <= 30 ? "Low Stock" : "In Stock",
            display_picture: display_picture,
            author: product.author || product.publisher || null,
            selling_price: product.sellingPrice,
            nomral_price: product.normalPrice,
            format: product.BookFormat,
          };
        })
      }));

      return new ApiResponse(true, 'Products fetched', {
        page,
        pageSize: CATEGORIES_PER_PAGE * PRODUCTS_PER_CATEGORY,
        total: allProducts.length,
        hasMore: page < totalPages,
        categories: formatted_categories,
        formats: formatted_formats,
        products: productsByCategory,
        pagination: {
          totalPages,
          currentPage: page,
          totalProducts: allProducts.length,
          totalCategories
        }
      });
    } catch (error) {
      this.logger.error("Error fetching products")
      return new ApiResponse(false, 'Failed to fetch products', { error: error.message || error.toString() });
    }
  }

  async getProductsByCategoryName(categoryName: string, page: number = 1, limit: number = 20) {
    this.logger.log(`[getProductsByCategoryName] Fetching products for category: ${categoryName}, page: ${page}, limit: ${limit}`);
    try {
      const skip = (page - 1) * limit;
      // Find products where ANY category name matches (case-insensitive)
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          skip,
          take: limit,
          where: {
            categories: { some: { name: { equals: categoryName, mode: 'insensitive' } } },
            isActive: true,
          },
          include: {
            categories: { select: { id: true, name: true } },
            formats: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({
          where: {
            categories: { some: { name: { equals: categoryName, mode: 'insensitive' } } },
            isActive: true,
          },
        }),
      ]);
      const totalPages = Math.ceil(total / limit);
      const hasMore = page < totalPages;
      const formattedProducts = products.map(this.formatProduct);
      return new ApiResponse(true, '', {
        products: formattedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
        hasMore,
      });
    } catch (error) {
      this.logger.error(`[getProductsByCategoryName] Error:`, error);
      throw error;
    }
  }

  async getProductById(id: string) {
    this.logger.log(`Fetching product with ID: ${id}`);

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
        const response = {
            id: product.id,
            name: product.name,
            description: product.description ?? undefined,
            sellingPrice: formatAmount(product.sellingPrice),
            normalPrice: formatAmount(product.normalPrice),
            amountSaved: formatAmount(Number(product.normalPrice) - Number(product.sellingPrice)),
            stock: product.stock,
            images: Array.isArray(product.displayImages) ? product.displayImages.map((img: any) => img.secure_url) : [],
            categoryId: product.categories && product.categories[0] ? product.categories[0].id : '',
            storeId: product.storeId ?? '',
            commission: product.commission ? Number(product.commission) : 0,
            isActive: product.isActive,
            status: product.status,
            isbn: product.isbn ?? undefined,
            format: product.BookFormat,
            publisher: product.publisher ?? undefined,
            author: product.author ?? undefined,
            pages: product.pages ?? undefined,
            language: product.languages ? product.languages.map(l => l.name) : [],
            genre: product.genres ? product.genres.map(g => g.name) : [],
            publishedDate: product.publishedDate ?? undefined,
            createdAt: formatDateWithoutTime(product.createdAt),
            updatedAt: formatDateWithoutTime(product.updatedAt),
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

        this.logger.log('Product retrieved successfully');
        return new ApiResponse(true, 'Product retrieved successfully', response);

    } catch (error) {
        this.logger.error('Error fetching product:', error);
        throw error;
    }
}

  async searchSuggestions(q: string) {
    this.logger.log(`[searchSuggestions] Query: '${q}'`);
    
    if (!q || q.length < 2) {
      this.logger.log('[searchSuggestions] Query too short, returning empty array.');
      return { success: true, data: [] };
    }
    try {
      // Search products by name, author, ISBN, or category name (case-insensitive, partial match)
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { author: { contains: q, mode: 'insensitive' } },
            { isbn: { contains: q, mode: 'insensitive' } },
            { categories: { some: { name: { contains: q, mode: 'insensitive' } } } },
          ],
          isActive: true,
        },
        include: {
          categories: { select: { id: true, name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      this.logger.log(`[searchSuggestions] Found ${products.length} results for query '${q}'.`);
      const data = products.map(product => {
        let image: string | null = null;
        let images = product.displayImages;
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
          } catch {
            images = [];
          }
        }
        if (Array.isArray(images) && images[0] && typeof images[0] === 'object' && 'secure_url' in images[0]) {
          image = typeof images[0].secure_url === 'string' ? images[0].secure_url : null;
        }
        return {
          id: product.id,
          title: product.name,
          author: product.author || '',
          image,
          slug: `${product.id}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          category: product.categories && product.categories.length > 0 ? product.categories[0].name : '',
        };
      });
      return { success: true, data };
    } catch (error) {
      this.logger.error(`[searchSuggestions] Error: ${error.message || error}`);
      return { success: false, data: [], error: error.message || error.toString() };
    }
  }
}
