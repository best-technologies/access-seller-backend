/**
 * OpenAPI schemas and request examples for `/vendor/inventory/*`.
 * Re-exported via `./index.ts` and consumed by `./endpoint-decorators.ts`.
 */

export const ErrorResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    statusCode: { type: 'integer' },
  },
};

export const CategorySchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'Office Supplies' },
    description: { type: 'string', nullable: true, example: 'Consumables' },
    skuPrefix: { type: 'string', example: 'OFF' },
    materialsCount: { type: 'integer', example: 5 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const MaterialSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    sku: { type: 'string', example: 'OFF-001' },
    name: { type: 'string', example: 'A4 Printing Paper' },
    unit: { type: 'string', example: 'reams' },
    description: { type: 'string', nullable: true },
    stock: { type: 'integer', example: 200 },
    reorderLevel: { type: 'integer', example: 50 },
    pricePerUnit: { type: 'number', example: 4200 },
    inventoryValue: { type: 'number', example: 840000 },
    status: {
      type: 'string',
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      example: 'in_stock',
    },
    imageUrl: { type: 'string', nullable: true },
    category: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', example: 'Office Supplies' },
        skuPrefix: { type: 'string', example: 'OFF' },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const CategoryCreatedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Category created' },
    data: CategorySchema,
    statusCode: { type: 'integer', example: 201 },
  },
};

export const CategoryResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: CategorySchema,
    statusCode: { type: 'integer', example: 200 },
  },
};

const PaginationMeta = {
  type: 'object' as const,
  properties: {
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalPages: { type: 'integer' },
    hasNextPage: { type: 'boolean' },
    hasPrevPage: { type: 'boolean' },
  },
};

export const CategoriesListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Categories retrieved' },
    data: { type: 'array', items: CategorySchema },
    meta: PaginationMeta,
    statusCode: { type: 'integer', example: 200 },
  },
};

export const MaterialResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: MaterialSchema,
    statusCode: { type: 'integer', example: 200 },
  },
};

export const MaterialCreatedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Material created' },
    data: MaterialSchema,
    statusCode: { type: 'integer', example: 201 },
  },
};

export const MaterialsListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Materials retrieved' },
    data: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalMaterials: { type: 'integer', example: 5 },
            totalCategories: { type: 'integer', example: 3 },
            totalStock: { type: 'integer', example: 1000 },
            totalInventoryValue: { type: 'number', example: 4200000 },
            totalUnitPriceSum: { type: 'number', example: 21000 },
          },
        },
        statusCounts: {
          type: 'object',
          properties: {
            inStock: { type: 'integer', example: 21 },
            lowStock: { type: 'integer', example: 12 },
            outOfStock: { type: 'integer', example: 3 },
          },
        },
        items: { type: 'array', items: MaterialSchema },
      },
    },
    meta: PaginationMeta,
    statusCode: { type: 'integer', example: 200 },
  },
};

export const DeletedRefResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        sku: { type: 'string' },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

export const MaterialMultipartBody = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'A4 Printing Paper' },
      categoryId: { type: 'string' },
      unit: { type: 'string', example: 'reams' },
      sku: {
        type: 'string',
        nullable: true,
        example: 'OFF-001',
        description:
          'Optional. If omitted a unique SKU is auto-generated from the category prefix.',
      },
      description: { type: 'string', nullable: true },
      stock: { type: 'integer', example: 200 },
      reorderLevel: { type: 'integer', example: 50 },
      pricePerUnit: { type: 'number', example: 4200 },
      image: {
        type: 'string',
        format: 'binary',
        description: 'Optional product image (jpeg/png/webp)',
      },
    },
    required: ['name', 'categoryId', 'unit'],
  },
};

export const CreateCategoryExamples = {
  basic: {
    summary: 'Minimal',
    value: {
      name: 'Office Supplies',
      description: 'Consumables and stationery for day-to-day operations.',
    },
  },
  withPrefix: {
    summary: 'Custom SKU prefix',
    value: {
      name: 'Office Supplies',
      description: 'Consumables and stationery.',
      skuPrefix: 'OFF',
    },
  },
};
