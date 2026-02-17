import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import * as colors from 'colors';

const HOMEPAGE_PRODUCTS_LIMIT = 500;

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all distribution stock products for the electronics homepage.
   * Returns each product with all its images. Public endpoint.
   */
  async getProducts() {
    this.logger.log(colors.yellow(`Fetching products for homepage`));

    try {
      const products = await this.prisma.distributionProduct.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: HOMEPAGE_PRODUCTS_LIMIT,
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          brand: true,
          model: true,
          category: true,
          unit: true,
          currentStock: true,
          wholesalePrice: true,
          retailPrice: true,
          images: true,
        },
      });
    this.logger.log(`Homepage products | count: ${products.length}`);
    const response = ResponseHelper.success('Products retrieved', products);
    this.logger.log(
      `Homepage products response | success: ${response.success}, message: ${response.message}, data.length: ${response.length}, statusCode: ${response.statusCode}`,
    );

    const formattedProducts = products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      brand: product.brand,
      model: product.model,
      category: product.category,
      images: product.images,
    }));
    this.logger.log(colors.magenta(`Formatted products: ${formattedProducts.length}`));
    return ResponseHelper.success('Products retrieved', formattedProducts);
  } catch (error) {
    this.logger.error(colors.red(`Error fetching products for homepage: ${error}`));
    throw error;
  } finally {
    this.logger.log(colors.yellow(`Finished fetching products for homepage`));
  }
  }
}
