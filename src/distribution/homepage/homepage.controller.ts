import { Controller, Get } from '@nestjs/common';
import { HomepageService } from './homepage.service';

@Controller('distribution/homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  /**
   * GET /api/v1/distribution/homepage/products
   * Fetch all distribution stock products for the electronics homepage.
   * Each item includes all its images. Public (no auth).
   */
  @Get('products')
  getProducts() {
    return this.homepageService.getProducts();
  }
}
