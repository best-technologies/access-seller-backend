import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

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

    this.logger.log(`Available categories: ${availableCategories.size}`);

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
        take: 20,
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

  async getProductStatistics() {
    this.logger.log("Fetching product statistics");
    
    try {
      // Get total product count
      const totalProducts = await this.prisma.product.count();
      
      // Get all products to check display images
      const allProducts = await this.prisma.product.findMany({
        select: { displayImages: true }
      });
      
      // Count products with null/empty display images
      const productsWithNullImages = allProducts.filter(product => {
        if (!product.displayImages) return true;
        
        let images;
        if (typeof product.displayImages === 'string') {
          try {
            images = JSON.parse(product.displayImages);
          } catch {
            return true; // Invalid JSON counts as null
          }
        } else {
          images = product.displayImages;
        }
        
        return !images || (Array.isArray(images) && images.length === 0) || 
               (typeof images === 'object' && Object.keys(images).length === 0);
      }).length;

      // Get count of products with valid display images
      const productsWithValidImages = totalProducts - productsWithNullImages;

      const statistics = {
        totalProducts,
        productsWithNullImages,
        productsWithValidImages,
        percentageWithImages: totalProducts > 0 ? ((productsWithValidImages / totalProducts) * 100).toFixed(2) : '0.00',
        percentageWithoutImages: totalProducts > 0 ? ((productsWithNullImages / totalProducts) * 100).toFixed(2) : '0.00'
      };

      this.logger.log(`Product statistics: ${JSON.stringify(statistics)}`);
      return new ApiResponse(true, 'Product statistics fetched successfully', statistics);
    } catch (error) {
      this.logger.error('Error fetching product statistics:', error);
      return new ApiResponse(false, 'Failed to fetch product statistics', { error: error.message || error.toString() });
    }
  }

  async getTotalProductCount() {
    this.logger.log("Fetching total product count");
    
    try {
      const totalProducts = await this.prisma.product.count();
      
      this.logger.log(`Total products in database: ${totalProducts}`);
      return new ApiResponse(true, 'Total product count fetched successfully', { totalProducts });
    } catch (error) {
      this.logger.error('Error fetching total product count:', error);
      return new ApiResponse(false, 'Failed to fetch total product count', { error: error.message || error.toString() });
    }
  }

  async exportProductsWithNullImagesToPDF(res: Response) {
    this.logger.log("Exporting products with null display images to PDF");
    
    try {
      // Get all products
      const allProducts = await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          sellingPrice: true,
          stock: true,
          displayImages: true,
          storeId: true,
          commission: true,
          BookFormat: true,
          isActive: true,
          status: true,
          rated: true,
          isbn: true,
          publisher: true,
          author: true,
          pages: true,
          publishedDate: true,
          createdAt: true,
          updatedAt: true,
          isFeatured: true,
          bookId: true,
          sku: true,
          shortDescription: true,
          taxStatus: true,
          backorders: true,
          soldIndividually: true,
          weight: true,
          length: true,
          width: true,
          height: true,
          allowCustomerReview: true,
          purchaseNote: true,
          tags: true,
          inStock: true,
          normalPrice: true,
          store: {
            select: {
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
          genres: {
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
          }
        }
      });
      
      // Filter products with null/empty display images
      const productsWithNullImages = allProducts.filter(product => {
        if (!product.displayImages) return true;
        
        let images;
        if (typeof product.displayImages === 'string') {
          try {
            images = JSON.parse(product.displayImages);
          } catch {
            return true; // Invalid JSON counts as null
          }
        } else {
          images = product.displayImages;
        }
        
        return !images || (Array.isArray(images) && images.length === 0) || 
               (typeof images === 'object' && Object.keys(images).length === 0);
      });

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="products-without-images-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Pagination settings
      const itemsPerPage = 15;
      const totalPages = Math.ceil(productsWithNullImages.length / itemsPerPage);
      
      // Define table headers with serial number
      const headers = [
        'S/N', 'ID', 'Name', 'Description', 'Selling Price', 'Stock', 'Store ID', 'Commission',
        'Book Format', 'Active', 'Status', 'Rated', 'ISBN', 'Publisher', 'Author',
        'Pages', 'Published Date', 'Created At', 'Updated At', 'Featured', 'Book ID',
        'SKU', 'Short Description', 'Tax Status', 'Backorders', 'Sold Individually',
        'Weight', 'Length', 'Width', 'Height', 'Allow Reviews', 'Purchase Note',
        'Tags', 'In Stock', 'Normal Price', 'Store Name', 'Categories', 'Formats',
        'Genres', 'Languages'
      ];
      
      // Set table properties
      const tableTop = 120;
      const tableLeft = 30;
      const colWidth = 70;
      const rowHeight = 25;
      const fontSize = 7;
      
      // Process each page
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          doc.addPage();
        }
        
        // Add page title
        doc.fontSize(16).text('Products Without Display Images', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Page ${pageNum + 1} of ${totalPages} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.fontSize(9).text(`Total products without images: ${productsWithNullImages.length}`, { align: 'center' });
        doc.moveDown(1);
        
        // Get products for this page
        const startIndex = pageNum * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, productsWithNullImages.length);
        const pageProducts = productsWithNullImages.slice(startIndex, endIndex);
        
        // Draw headers
        doc.fontSize(fontSize);
        headers.forEach((header, index) => {
          const x = tableLeft + (index * colWidth);
          doc.rect(x, tableTop, colWidth, rowHeight).stroke();
          doc.text(header, x + 2, tableTop + 2, { 
            width: colWidth - 4, 
            height: rowHeight - 4,
            align: 'center'
          });
        });
        
        // Draw data rows
        pageProducts.forEach((product, rowIndex) => {
          const y = tableTop + ((rowIndex + 1) * rowHeight);
          
          // Product data with serial number
          const rowData = [
            (startIndex + rowIndex + 1).toString(), // Serial number
            product.id,
            product.name || '',
            product.description || '',
            product.sellingPrice?.toString() || '',
            product.stock?.toString() || '',
            product.storeId || '',
            product.commission || '',
            product.BookFormat || '',
            product.isActive?.toString() || '',
            product.status || '',
            product.rated || '',
            product.isbn || '',
            product.publisher || '',
            product.author || '',
            product.pages?.toString() || '',
            product.publishedDate ? new Date(product.publishedDate).toLocaleDateString() : '',
            product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '',
            product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '',
            product.isFeatured?.toString() || '',
            product.bookId || '',
            product.sku || '',
            product.shortDescription || '',
            product.taxStatus || '',
            product.backorders?.toString() || '',
            product.soldIndividually?.toString() || '',
            product.weight?.toString() || '',
            product.length?.toString() || '',
            product.width?.toString() || '',
            product.height?.toString() || '',
            product.allowCustomerReview?.toString() || '',
            product.purchaseNote || '',
            product.tags?.join(', ') || '',
            product.inStock?.toString() || '',
            product.normalPrice?.toString() || '',
            product.store ? `${product.store.first_name} ${product.store.last_name}` : '',
            product.categories?.map(c => c.name).join(', ') || '',
            product.formats?.map(f => f.name).join(', ') || '',
            product.genres?.map(g => g.name).join(', ') || '',
            product.languages?.map(l => l.name).join(', ') || ''
          ];
          
          // Draw cells
          rowData.forEach((cellData, colIndex) => {
            const x = tableLeft + (colIndex * colWidth);
            doc.rect(x, y, colWidth, rowHeight).stroke();
            doc.text(cellData || '', x + 2, y + 2, { 
              width: colWidth - 4, 
              height: rowHeight - 4,
              ellipsis: true
            });
          });
        });
        
        // Add page footer
        doc.fontSize(8).text(
          `Page ${pageNum + 1} of ${totalPages} | Products ${startIndex + 1} to ${endIndex} of ${productsWithNullImages.length}`,
          tableLeft,
          doc.page.height - 50,
          { width: doc.page.width - 60 }
        );
      }
      
      // Finalize PDF
      doc.end();
      
      this.logger.log(`PDF exported successfully with ${productsWithNullImages.length} products across ${totalPages} pages`);
      
    } catch (error) {
      this.logger.error('Error exporting PDF:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to export PDF', 
        error: error.message || error.toString() 
      });
    }
  }
}