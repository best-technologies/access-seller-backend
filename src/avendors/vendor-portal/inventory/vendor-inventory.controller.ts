import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { GetVendorContext } from '../decorators/get-vendor-context.decorator';
import type { VendorPortalContext } from '../guards/vendor-portal.guard';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import {
  ApiDocAdjustStock,
  ApiDocCreateCategory,
  ApiDocCreateMaterial,
  ApiDocDeleteCategory,
  ApiDocDeleteMaterial,
  ApiDocGetCategory,
  ApiDocGetMaterial,
  ApiDocListCategories,
  ApiDocListMaterials,
  ApiDocUpdateCategory,
  ApiDocUpdateMaterial,
} from './doc';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateVendorInventoryCategoryDto } from './dto/create-category.dto';
import { CreateVendorInventoryMaterialDto } from './dto/create-material.dto';
import { ListVendorInventoryCategoriesQueryDto } from './dto/list-categories-query.dto';
import { ListVendorInventoryMaterialsQueryDto } from './dto/list-materials-query.dto';
import { UpdateVendorInventoryCategoryDto } from './dto/update-category.dto';
import { UpdateVendorInventoryMaterialDto } from './dto/update-material.dto';
import { VendorInventoryService } from './vendor-inventory.service';

@ApiTags('Vendor Portal — Inventory')
@ApiBearerAuth()
@Controller('vendor/inventory')
@UseGuards(JwtGuard, VendorPortalGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class VendorInventoryController {
  constructor(private readonly service: VendorInventoryService) {}

  // ─── CATEGORIES ───────────────────────────────────────────

  @Post('categories')
  @ApiDocCreateCategory()
  async createCategory(
    @GetVendorContext() ctx: VendorPortalContext,
    @Body() dto: CreateVendorInventoryCategoryDto,
  ) {
    return this.service.createCategory(ctx.vendorId, dto);
  }

  @Get('categories')
  @ApiDocListCategories()
  async listCategories(
    @GetVendorContext() ctx: VendorPortalContext,
    @Query() query: ListVendorInventoryCategoriesQueryDto,
  ) {
    return this.service.listCategories(ctx.vendorId, query);
  }

  @Get('categories/:id')
  @ApiDocGetCategory()
  async getCategory(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
  ) {
    return this.service.getCategory(ctx.vendorId, id);
  }

  @Patch('categories/:id')
  @ApiDocUpdateCategory()
  async updateCategory(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
    @Body() dto: UpdateVendorInventoryCategoryDto,
  ) {
    return this.service.updateCategory(ctx.vendorId, id, dto);
  }

  @Delete('categories/:id')
  @ApiDocDeleteCategory()
  async deleteCategory(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
  ) {
    return this.service.deleteCategory(ctx.vendorId, id);
  }

  // ─── MATERIALS ────────────────────────────────────────────

  @Post('materials')
  @ApiDocCreateMaterial()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  async createMaterial(
    @GetVendorContext() ctx: VendorPortalContext,
    @Body() dto: CreateVendorInventoryMaterialDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] } = {},
  ) {
    return this.service.createMaterial(ctx.vendorId, dto, files?.image?.[0]);
  }

  @Get('materials')
  @ApiDocListMaterials()
  async listMaterials(
    @GetVendorContext() ctx: VendorPortalContext,
    @Query() query: ListVendorInventoryMaterialsQueryDto,
  ) {
    return this.service.listMaterials(ctx.vendorId, query);
  }

  @Get('materials/:id')
  @ApiDocGetMaterial()
  async getMaterial(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
  ) {
    return this.service.getMaterial(ctx.vendorId, id);
  }

  @Patch('materials/:id')
  @ApiDocUpdateMaterial()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  async updateMaterial(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
    @Body() dto: UpdateVendorInventoryMaterialDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] } = {},
  ) {
    return this.service.updateMaterial(ctx.vendorId, id, dto, files?.image?.[0]);
  }

  @Patch('materials/:id/stock')
  @ApiDocAdjustStock()
  async adjustStock(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.service.adjustStock(ctx.vendorId, id, dto);
  }

  @Delete('materials/:id')
  @ApiDocDeleteMaterial()
  async deleteMaterial(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('id') id: string,
  ) {
    return this.service.deleteMaterial(ctx.vendorId, id);
  }
}
