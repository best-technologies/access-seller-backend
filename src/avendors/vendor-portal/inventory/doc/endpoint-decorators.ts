/**
 * Composed Swagger decorators for every `/vendor/inventory/*` endpoint.
 * Kept out of the controller so the controller stays purely route/handler code.
 */
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { CreateVendorInventoryCategoryDto } from '../dto/create-category.dto';
import { VendorInventoryStockStatus } from '../dto/list-materials-query.dto';
import { UpdateVendorInventoryCategoryDto } from '../dto/update-category.dto';
import {
  CategoriesListResponse,
  CategoryCreatedResponse,
  CategoryResponse,
  CreateCategoryExamples,
  DeletedRefResponse,
  ErrorResponse,
  MaterialCreatedResponse,
  MaterialMultipartBody,
  MaterialResponse,
  MaterialsListResponse,
} from './schemas';

// ─── Categories ───────────────────────────────────────────────

export const ApiDocCreateCategory = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create an inventory category',
      description:
        'Creates a new vendor-scoped material category (e.g. "Office Supplies"). ' +
        'A unique `skuPrefix` is auto-derived from the name if not provided and is used ' +
        'when auto-generating material SKUs (e.g. `OFF-001`).',
    }),
    ApiBody({
      type: CreateVendorInventoryCategoryDto,
      examples: CreateCategoryExamples,
    }),
    ApiResponse({ status: 201, description: 'Category created', schema: CategoryCreatedResponse }),
    ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse }),
    ApiResponse({ status: 409, description: 'Duplicate category name', schema: ErrorResponse }),
  );

export const ApiDocListCategories = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List inventory categories',
      description:
        'Paginated vendor-owned categories with a `materialsCount` per row. Use `search` for case-insensitive name filtering.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiResponse({ status: 200, description: 'Categories retrieved', schema: CategoriesListResponse }),
    ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse }),
  );

export const ApiDocGetCategory = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get an inventory category by id' }),
    ApiParam({ name: 'id', description: 'Category id (cuid)' }),
    ApiResponse({ status: 200, description: 'Category retrieved', schema: CategoryResponse }),
    ApiResponse({ status: 404, description: 'Category not found', schema: ErrorResponse }),
  );

export const ApiDocUpdateCategory = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update an inventory category',
      description:
        'Partial update of `name`, `description`, or `skuPrefix`. Changing `skuPrefix` does NOT rewrite SKUs of existing materials.',
    }),
    ApiParam({ name: 'id', description: 'Category id (cuid)' }),
    ApiBody({ type: UpdateVendorInventoryCategoryDto }),
    ApiResponse({ status: 200, description: 'Category updated', schema: CategoryResponse }),
    ApiResponse({ status: 404, description: 'Category not found', schema: ErrorResponse }),
    ApiResponse({ status: 409, description: 'Duplicate category name', schema: ErrorResponse }),
  );

export const ApiDocDeleteCategory = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete an inventory category',
      description:
        'Deletes a category only if it has no materials attached. Reassign or delete the materials first.',
    }),
    ApiParam({ name: 'id', description: 'Category id (cuid)' }),
    ApiResponse({ status: 200, description: 'Category deleted', schema: DeletedRefResponse }),
    ApiResponse({
      status: 400,
      description: 'Category has materials — cannot delete',
      schema: ErrorResponse,
    }),
    ApiResponse({ status: 404, description: 'Category not found', schema: ErrorResponse }),
  );

// ─── Materials ────────────────────────────────────────────────

export const ApiDocCreateMaterial = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create an inventory material',
      description:
        'Creates a material (SKU row) under one of the vendor-owned categories. ' +
        'Supports optional image upload (multipart). If `sku` is omitted, a unique code ' +
        'is auto-generated in the form `<CATEGORY_PREFIX>-###` (e.g. `OFF-001`).',
    }),
    ApiConsumes('multipart/form-data', 'application/json'),
    ApiBody(MaterialMultipartBody),
    ApiResponse({ status: 201, description: 'Material created', schema: MaterialCreatedResponse }),
    ApiResponse({
      status: 400,
      description: 'Validation error or category does not belong to this vendor',
      schema: ErrorResponse,
    }),
    ApiResponse({
      status: 409,
      description: 'SKU already used by another of your materials',
      schema: ErrorResponse,
    }),
  );

export const ApiDocListMaterials = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List inventory materials',
      description:
        'Paginated list with per-vendor analytics (`summary`: totalMaterials / totalCategories / ' +
        'totalStock / totalInventoryValue / totalUnitPriceSum) and tab counters (`statusCounts`: ' +
        'inStock / lowStock / outOfStock). Supports `search`, `categoryId` and a stock-status tab filter.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'categoryId', required: false, type: String }),
    ApiQuery({ name: 'status', required: false, enum: VendorInventoryStockStatus }),
    ApiResponse({ status: 200, description: 'Materials retrieved', schema: MaterialsListResponse }),
    ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse }),
  );

export const ApiDocGetMaterial = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a material by id' }),
    ApiParam({ name: 'id', description: 'Material id (cuid)' }),
    ApiResponse({ status: 200, description: 'Material retrieved', schema: MaterialResponse }),
    ApiResponse({ status: 404, description: 'Material not found', schema: ErrorResponse }),
  );

export const ApiDocUpdateMaterial = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a material',
      description:
        'Partial update. Accepts the same multipart body as create (any subset of fields) and an ' +
        'optional replacement image. The old image (if any) is removed from storage when a new one is uploaded.',
    }),
    ApiParam({ name: 'id', description: 'Material id (cuid)' }),
    ApiConsumes('multipart/form-data', 'application/json'),
    ApiBody(MaterialMultipartBody),
    ApiResponse({ status: 200, description: 'Material updated', schema: MaterialResponse }),
    ApiResponse({
      status: 400,
      description: 'Validation error or no fields provided',
      schema: ErrorResponse,
    }),
    ApiResponse({ status: 404, description: 'Material not found', schema: ErrorResponse }),
    ApiResponse({ status: 409, description: 'SKU collision', schema: ErrorResponse }),
  );

export const ApiDocAdjustStock = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Adjust stock for a material',
      description:
        'Convenience endpoint to bump/reduce or set absolute stock without touching other fields. ' +
        'Use `action=increment|decrement` with a positive `quantity`, or `action=set` to assign an absolute value.',
    }),
    ApiParam({ name: 'id', description: 'Material id (cuid)' }),
    ApiBody({ type: AdjustStockDto }),
    ApiResponse({ status: 200, description: 'Stock adjusted', schema: MaterialResponse }),
    ApiResponse({
      status: 400,
      description: 'Invalid adjustment (e.g. would go negative)',
      schema: ErrorResponse,
    }),
    ApiResponse({ status: 404, description: 'Material not found', schema: ErrorResponse }),
  );

export const ApiDocDeleteMaterial = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a material',
      description: 'Permanently removes the material row and deletes any attached image from storage.',
    }),
    ApiParam({ name: 'id', description: 'Material id (cuid)' }),
    ApiResponse({ status: 200, description: 'Material deleted', schema: DeletedRefResponse }),
    ApiResponse({ status: 404, description: 'Material not found', schema: ErrorResponse }),
  );
