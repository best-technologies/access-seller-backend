/**
 * Swagger response schemas for A-Vendor User Management endpoints.
 */

const UserItemSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clxyz1234567890' },
    email: { type: 'string', example: 'vendor@example.com' },
    first_name: { type: 'string', example: 'Akindele' },
    last_name: { type: 'string', example: 'Oluwaseun' },
    username: { type: 'string', nullable: true },
    phone_number: { type: 'string', nullable: true },
    display_picture: { type: 'string', nullable: true },
    company_position: { type: 'string', nullable: true },
    is_a_vendor: { type: 'boolean', example: true },
    role: { type: 'string', example: 'admin' },
    status: { type: 'string', example: 'active' },
    is_active: { type: 'boolean', example: true },
    usertype: { type: 'string', nullable: true },
    allowed_platforms: { type: 'array', items: { type: 'string' }, example: ['avendor'] },
    allowed_platforms_for_user: { type: 'array', items: { type: 'string' }, example: ['avendor'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const PaginationMeta = {
  type: 'object' as const,
  properties: {
    total: { type: 'integer', example: 42 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 3 },
    hasNextPage: { type: 'boolean', example: true },
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

export const UserListResponse = wrapSuccess(
  { type: 'array', items: UserItemSchema },
  PaginationMeta,
);

export const UserUpdatedResponse = wrapSuccess(UserItemSchema);

export const UpdateUserBody = {
  type: 'object' as const,
  properties: {
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone_number: { type: 'string' },
    username: { type: 'string' },
    role: {
      type: 'string',
      enum: ['super_admin', 'admin', 'inventory_manager', 'shipment_manager', 'marketer', 'user'],
    },
    status: { type: 'string', enum: ['active', 'suspended', 'inactive'] },
    allowed_platforms: {
      type: 'string',
      example: '["avendor","access-seller"]',
      description: 'Admin console platforms (JSON array string)',
    },
    allowed_platforms_for_user: {
      type: 'string',
      example: '["avendor"]',
      description: 'User segmentation platforms (JSON array string)',
    },
    display_picture: { type: 'string', format: 'binary' },
  },
};
