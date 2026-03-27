/**
 * Swagger response schemas for A-Vendor Permissions endpoints.
 */

const AccessLevelEnum = {
  type: 'string' as const,
  enum: ['full_access', 'view_only', 'no_access'],
  example: 'view_only',
};

const ModuleCatalogItemSchema = {
  type: 'object' as const,
  properties: {
    key: { type: 'string', example: 'inventory' },
    label: { type: 'string', example: 'Inventory' },
    description: { type: 'string', example: 'Add and monitor material.' },
  },
};

const PermissionUserSchema = {
  type: 'object' as const,
  properties: {
    email: { type: 'string', example: 'user@example.com' },
    first_name: { type: 'string', example: 'John' },
    last_name: { type: 'string', example: 'Doe' },
  },
};

const PermissionRowSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clxyz1234567890' },
    userId: { type: 'string' },
    user: PermissionUserSchema,
    modules: {
      type: 'object',
      properties: {
        vendors_management: AccessLevelEnum,
        inventory: AccessLevelEnum,
        rfqs: AccessLevelEnum,
        order_management: AccessLevelEnum,
        invoice: AccessLevelEnum,
        payment: AccessLevelEnum,
        onboarding: AccessLevelEnum,
      },
    },
    module_catalog: { type: 'array', items: ModuleCatalogItemSchema },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const PaginationMeta = {
  type: 'object' as const,
  properties: {
    total: { type: 'integer', example: 15 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 1 },
    hasNextPage: { type: 'boolean', example: false },
    hasPrevPage: { type: 'boolean', example: false },
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

export const ErrorResponse = {
  type: 'object' as const,
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string' },
    error: { type: 'string' },
  },
};

export const ModuleCatalogResponse = wrapSuccess({
  type: 'object',
  properties: {
    modules: { type: 'array', items: ModuleCatalogItemSchema },
    access_levels: { type: 'array', items: { type: 'string' }, example: ['full_access', 'view_only', 'no_access'] },
  },
});

export const PermissionDetailResponse = wrapSuccess(PermissionRowSchema);

export const PermissionListResponse = wrapSuccess(
  { type: 'array', items: PermissionRowSchema },
  PaginationMeta,
);

export const PermissionCreatedResponse = wrapSuccess(PermissionRowSchema);

export const PermissionUpdatedResponse = wrapSuccess(PermissionRowSchema);

export const PermissionDeletedResponse = wrapSuccess({
  type: 'object',
  properties: {
    userId: { type: 'string' },
  },
});
