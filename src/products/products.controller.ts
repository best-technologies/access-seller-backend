import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('')
  async getAllPublicProductsSections() {
    return this.productsService.getAllPublicProductsSections();
  }

  @Get('browse')
  async getPaginatedProducts(@Query('page') page: string) {
    const pageNumber = parseInt(page, 10) || 1;
    return this.productsService.getPaginatedProducts(pageNumber);
  }

  @Get('by-category/:categoryName')
  async getProductsByCategoryName(
    @Param('categoryName') categoryName: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.productsService.getProductsByCategoryName(
      categoryName,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20
    );
  }

  @Get('search-suggestions')
  async searchSuggestions(@Query('q') q: string) {
    return this.productsService.searchSuggestions(q);
  }

  @Get(':id')
    async getProductById(@Param('id') id: string) {
        return this.productsService.getProductById(id);
    }
}
