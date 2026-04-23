/**
 * Swagger response schemas for A-Vendor User endpoints.
 */

const AccessLevelEnum = {
  type: 'string' as const,
  enum: ['full_access', 'view_only', 'no_access'],
};

const ModuleCatalogItemSchema = {
  type: 'object' as const,
  properties: {
    key: { type: 'string', example: 'inventory' },
    label: { type: 'string', example: 'Inventory' },
    description: { type: 'string' },
  },
};

const ProfileSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    first_name: { type: 'string', example: 'Akindele' },
    last_name: { type: 'string', example: 'Oluwaseun' },
    username: { type: 'string', nullable: true },
    email: { type: 'string', example: 'user@example.com' },
    phone_number: { type: 'string', nullable: true },
    company_position: { type: 'string', nullable: true },
    display_picture: { type: 'string', nullable: true },
    role: { type: 'string', example: 'admin' },
    status: { type: 'string', example: 'active' },
    is_active: { type: 'boolean', example: true },
    is_email_verified: { type: 'boolean', example: true },
    address: { type: 'string', nullable: true },
    allowed_platforms: { type: 'array', items: { type: 'string' }, example: ['avendor'] },
    global_permission_slugs: { type: 'array', items: { type: 'string' } },
    security: {
      type: 'object',
      properties: {
        has_login_password: { type: 'boolean', example: true },
        has_guest_password: { type: 'boolean', example: false },
      },
    },
    avendor: {
      type: 'object',
      properties: {
        has_platform_flag: { type: 'boolean', example: true },
        permission_record: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
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
            access_levels: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    timestamps: {
      type: 'object',
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

const wrapSuccess = (dataSchema: object) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: dataSchema,
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

export const ProfileResponse = wrapSuccess(ProfileSchema);
