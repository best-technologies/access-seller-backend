/**
 * Swagger response schemas for A-Vendor Inventory endpoints.
 */

const CategorySchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clxyz1234567890' },
    name: { type: 'string', example: 'Office Supplies' },
    description: { type: 'string', nullable: true, example: 'General office materials' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    _count: {
      type: 'object',
      properties: { materials: { type: 'integer', example: 5 } },
    },
  },
};

const MaterialSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clxyz1234567890' },
    name: { type: 'string', example: 'A4 Printing Paper' },
    categoryId: { type: 'string' },
    unit: { type: 'string', example: 'reams' },
    description: { type: 'string', nullable: true },
    stock: { type: 'integer', example: 200 },
    reorderLevel: { type: 'integer', example: 50 },
    pricePerUnit: { type: 'number', example: 4200 },
    imageUrl: { type: 'string', nullable: true },
    imagePublicId: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    category: { ...CategorySchema },
  },
};

const PaginationMeta = {
  type: 'object' as const,
  properties: {
    total: { type: 'integer', example: 23 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 2 },
    hasNextPage: { type: 'boolean', example: true },
    hasPrevPage: { type: 'boolean', example: false },
  },
};

const AnalysisSchema = {
  type: 'object' as const,
  properties: {
    totalMaterials: { type: 'integer', example: 5 },
    inventoryValue: { type: 'number', example: 75447500 },
    lowStockCount: { type: 'integer', example: 2 },
    outOfStockCount: { type: 'integer', example: 3 },
  },
};

const wrapSuccess = (dataSchema: object, metaSchema?: object) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: dataSchema,
    ...(metaSchema ? { meta: metaSchema } : {}),
    statusCode: { type: 'integer', example: 200 },
  },
});

const DeletedRefSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

export const ErrorResponse = {
  type: 'object' as const,
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string' },
    error: { type: 'string' },
  },
};

// ─── Category responses ─────────────────────────────────────

export const CategoryCreatedResponse = wrapSuccess(CategorySchema);
export const CategoryListResponse = wrapSuccess(
  { type: 'array', items: CategorySchema },
  PaginationMeta,
);
export const CategoryDetailResponse = wrapSuccess(CategorySchema);
export const CategoryUpdatedResponse = wrapSuccess(CategorySchema);
export const CategoryDeletedResponse = wrapSuccess(DeletedRefSchema);

// ─── Material responses ─────────────────────────────────────

export const MaterialCreatedResponse = wrapSuccess(MaterialSchema);
export const MaterialListResponse = wrapSuccess({
  type: 'object',
  properties: {
    analysis: AnalysisSchema,
    items: { type: 'array', items: MaterialSchema },
    meta: PaginationMeta,
  },
});
export const MaterialDetailResponse = wrapSuccess(MaterialSchema);
export const MaterialUpdatedResponse = wrapSuccess(MaterialSchema);
export const MaterialDeletedResponse = wrapSuccess(DeletedRefSchema);

// ─── Shared body schemas ────────────────────────────────────

export const CreateMaterialBody = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', example: 'A4 paper' },
    categoryId: { type: 'string' },
    unit: { type: 'string', example: 'reams' },
    description: { type: 'string' },
    stock: { type: 'number', example: 200 },
    reorderLevel: { type: 'number', example: 50 },
    pricePerUnit: { type: 'number', example: 4200 },
    image: { type: 'string', format: 'binary' },
  },
  required: ['name', 'categoryId'],
};

export const UpdateMaterialBody = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' },
    categoryId: { type: 'string' },
    unit: { type: 'string' },
    description: { type: 'string' },
    stock: { type: 'number' },
    reorderLevel: { type: 'number' },
    pricePerUnit: { type: 'number' },
    image: { type: 'string', format: 'binary' },
  },
};
