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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorInventoryService } from './avendor-inventory.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials-query.dto';
import {
  CategoryCreatedResponse,
  CategoryListResponse,
  CategoryDetailResponse,
  CategoryUpdatedResponse,
  CategoryDeletedResponse,
  MaterialCreatedResponse,
  MaterialListResponse,
  MaterialDetailResponse,
  MaterialUpdatedResponse,
  MaterialDeletedResponse,
  CreateMaterialBody,
  UpdateMaterialBody,
  ErrorResponse,
} from './avendor-inventory.swagger';

@ApiTags('A-Vendor — Inventory')
@ApiBearerAuth()
@Controller('avendor/inventory')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class AvendorInventoryController {
  constructor(private readonly service: AvendorInventoryService) {}

  // ─── CATEGORIES ───────────────────────────────────────────

  @Post('categories')
  @ApiOperation({
    summary: 'Create a material category',
    description: 'Requires super_admin or full_access on A-Vendor inventory permission.',
  })
  @ApiResponse({ status: 201, description: 'Category created', schema: CategoryCreatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 409, description: 'Duplicate category name', schema: ErrorResponse })
  createCategory(
    @Body() dto: CreateCategoryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.createCategory(dto, user);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List material categories',
    description: 'Paginated list with optional search. Requires at least view access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Paginated category list', schema: CategoryListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  listCategories(
    @Query() query: ListCategoriesQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listCategories(query, user);
  }

  @Get('categories/:id')
  @ApiOperation({
    summary: 'Get a single category',
    description: 'Requires at least view access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Category payload', schema: CategoryDetailResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  getCategory(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.getCategory(id, user);
  }

  @Patch('categories/:id')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Requires super_admin or full_access on A-Vendor inventory permission.',
  })
  @ApiResponse({ status: 200, description: 'Updated category', schema: CategoryUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  @ApiResponse({ status: 409, description: 'Duplicate category name', schema: ErrorResponse })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateCategory(id, dto, user);
  }

  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Fails if materials still reference this category. Requires super_admin or full_access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Category deleted', schema: CategoryDeletedResponse })
  @ApiResponse({ status: 400, description: 'Category still has materials', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  deleteCategory(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteCategory(id, user);
  }

  // ─── MATERIALS ────────────────────────────────────────────

  @Post('materials')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Create a new inventory material. Image is optional.', schema: CreateMaterialBody })
  @ApiOperation({
    summary: 'Create an inventory material',
    description: 'Multipart form-data. Optional image upload (PNG, JPEG, WebP up to 10MB). Requires super_admin or full_access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 201, description: 'Material created', schema: MaterialCreatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error / bad category', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  createMaterial(
    @Body() dto: CreateMaterialDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const image = files?.image?.[0];
    return this.service.createMaterial(dto, image, user);
  }

  @Get('materials')
  @ApiOperation({
    summary: 'List inventory materials',
    description: 'Paginated list with analysis summary (total materials, inventory value, low stock, out of stock). Requires at least view access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Paginated material list with analysis', schema: MaterialListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  listMaterials(
    @Query() query: ListMaterialsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listMaterials(query, user);
  }

  @Get('materials/:id')
  @ApiOperation({
    summary: 'Get a single material',
    description: 'Includes category details. Requires at least view access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Material payload', schema: MaterialDetailResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  getMaterial(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.getMaterial(id, user);
  }

  @Patch('materials/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Update an inventory material. Send only fields to change. New image replaces the old one.', schema: UpdateMaterialBody })
  @ApiOperation({
    summary: 'Update an inventory material',
    description: 'Multipart form-data. New image replaces old (old deleted from storage). Requires super_admin or full_access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Updated material', schema: MaterialUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const image = files?.image?.[0];
    return this.service.updateMaterial(id, dto, image, user);
  }

  @Delete('materials/:id')
  @ApiOperation({
    summary: 'Delete an inventory material',
    description: 'Removes the material and cleans up its image from storage. Requires super_admin or full_access on A-Vendor inventory.',
  })
  @ApiResponse({ status: 200, description: 'Material deleted', schema: MaterialDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  deleteMaterial(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteMaterial(id, user);
  }
}
