import { Controller, Get, Param, Query, Put, Post, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtGuard } from '../../auth/guard';
import { GetProductsDto, GetProductByIdDto } from './dto/get-products.dto';
import { EditProductDTO } from './dto/edit-product.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DynamicFileFieldsInterceptor } from './interceptors/dynamic-file-fields.interceptor';

@Controller('admin/products')
@UseGuards(JwtGuard)
@Roles("admin")
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Get('dashboard')
    async getProductDashboard(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.productsService.getProductDashboard(page, limit);
    }

    @Get('filters')
    async getFilterOptions() {
        return this.productsService.getFilterOptions();
    }

    @Get("all")
    async adminGetAllProductDashboard(@Query() query: GetProductsDto) {
        return this.productsService.adminGetAllProductDashboard(
            query.page,
            query.limit,
            query.search,
            query.format,
        );
    }

    @Get(':id')
    async getProductById(@Param() params: GetProductByIdDto) {
        return this.productsService.getProductById(params.id);
    }

    @Put(':id/status')
    async updateProductStatus(
        @Param('id') id: string,
        @Query('status') status: 'active' | 'inactive' | 'suspended'
    ) {
        return this.productsService.updateProductStatus(id, status);
    }

    @Get('store/:storeId')
    async getProductsByStore(
        @Param('storeId') storeId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.productsService.getProductsByStore(storeId, page, limit);
    }

    @Get('analytics/overview')
    async getProductAnalytics() {
        return this.productsService.getProductAnalytics();
    }

    @Get('validation-info')
    async getValidationInfo() {
        return this.productsService.getValidationInfo();
    }

    @Post('add-new')
    @UseInterceptors(FileInterceptor('coverImage'))
    async addBook(
    @Body() formData: any,
    @UploadedFile() coverImage: Express.Multer.File
    ) {
    const coverImages = coverImage ? [coverImage] : [];

    return this.productsService.addBook(formData, coverImages);
    }

    @Post('books/upload')
    @UseInterceptors(FileInterceptor('file'))
    async addBooksFromFile(@UploadedFile() file: Express.Multer.File) {
        return this.productsService.addBooksFromFile(file);
    }

    @Get('with-commission')
    async getProductsWithCommission(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.productsService.getProductsWithCommission(Number(page), Number(limit));
    }

    @Get('by-category/:categoryName')
    async getProductsByCategoryName(
        @Param('categoryName') categoryName: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.productsService.getProductsByCategoryName(categoryName, Number(page), Number(limit));
    }

    @Get('edit/:id')
    async getProductForEdit(@Param('id') id: string) {
        return this.productsService.getProductForEdit(id);
    }

    @Put('edit/:id')
    @UseInterceptors(FileInterceptor('coverImage'))
    async editProduct(
        @Param('id') id: string,
        @Body() editProductDto: any, // Changed to any to handle multipart form data more flexibly
        @UploadedFile() coverImage: Express.Multer.File
    ) {
        const coverImages = coverImage ? [coverImage] : [];
        return this.productsService.editProduct(id, editProductDto, coverImages);
    }

} 