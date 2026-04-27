/**
 * OpenAPI response / body schemas for A-Vendor Vendors endpoints.
 * Keep all Swagger shape definitions here; the controller composes them via
 * the decorators in `./endpoint-decorators.ts`.
 */

const VendorSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clh3q9x0m0000abcdexample', description: 'Internal PK (cuid)' },
    vendorCode: {
      type: 'string',
      nullable: true,
      example: 'av-2026-195',
      description: 'Public supplier code. Legacy rows may match `id` when `id` was created as `av-…` before this split.',
    },
    name: { type: 'string', example: 'Global Supplies Ltd' },
    email: { type: 'string', example: 'contact@globalsupplies.com' },
    phone: { type: 'string', nullable: true, example: '+2348161252897' },
    city: { type: 'string', nullable: true, example: 'Lagos' },
    country: { type: 'string', nullable: true, example: 'Nigeria' },
    status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
    complianceStatus: { type: 'string', enum: ['compliant', 'non_compliant', 'warning'], example: 'compliant' },
    complianceOverride: { type: 'boolean', example: false },
    rating: { type: 'number', nullable: true, example: 4.8 },
    totalOrders: { type: 'integer', example: 24 },
    totalSpend: { type: 'number', example: 6750000 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    bankDetail: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string' },
        bankName: { type: 'string', example: 'First Bank Nigeria' },
        accountNumber: { type: 'string', example: '2033445566' },
        accountName: { type: 'string', example: 'Dangote Industries Ltd' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          documentType: { type: 'string', example: 'TIN' },
          label: { type: 'string', example: 'Tax ID Certificate' },
          imageUrl: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['valid', 'expired', 'pending'], example: 'valid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          authorId: { type: 'string', nullable: true },
          authorName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

const PortalUserSummarySchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    username: { type: 'string', nullable: true },
  },
};

const VendorCreatedDataSchema = {
  type: 'object' as const,
  properties: {
    ...VendorSchema.properties,
    portalUser: PortalUserSummarySchema,
    linkedExistingUser: {
      type: 'boolean',
      example: false,
      description:
        'True when the email matched an existing User who was linked to the new supplier (no new account).',
    },
    defaultPassword: {
      type: 'string',
      nullable: true,
      example: 'avendor123',
      description: 'Present only when a new User row was created; omitted when linkedExistingUser is true.',
    },
    message: {
      type: 'string',
      description: 'Explains default password vs existing-password sign-in.',
    },
  },
};

/** OpenAPI request examples for POST /avendor/vendors (see CreateVendorDto). */
export const CreateVendorRequestExamples = {
  newContact: {
    summary: 'New email — creates User',
    description:
      'Response includes defaultPassword and linkedExistingUser: false.',
    value: {
      name: 'Global Supplies Ltd',
      email: 'contact@globalsupplies.com',
      user: {
        first_name: 'Chioma',
        last_name: 'Adeyemi',
      },
      phone: '+2348161252897',
      industry: 'Industrial Equipment',
      address: '12 Adeola Odeku Street',
      city: 'Lagos',
      country: 'Nigeria',
      status: 'active',
    },
  },
  existingUserEmail: {
    summary: 'Existing email — link user to supplier',
    description:
      'Same body shape. If this email already exists in User and is not linked to a supplier, that account is linked; response has linkedExistingUser: true and no defaultPassword.',
    value: {
      name: 'Global Supplies Ltd',
      email: 'existing.user@example.com',
      user: {
        first_name: 'Chioma',
        last_name: 'Adeyemi',
      },
      phone: '+2348161252897',
      city: 'Lagos',
      country: 'Nigeria',
      status: 'active',
    },
  },
};

const BankSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    vendorId: { type: 'string' },
    bankName: { type: 'string', example: 'First Bank Nigeria' },
    accountNumber: { type: 'string', example: '2033445566' },
    accountName: { type: 'string', example: 'Dangote Industries Ltd' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const DocumentSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    vendorId: { type: 'string' },
    documentType: { type: 'string', example: 'TIN' },
    label: { type: 'string', example: 'Tax ID Certificate' },
    imageUrl: { type: 'string', nullable: true },
    imagePublicId: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['valid', 'expired', 'pending'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const NoteSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    vendorId: { type: 'string' },
    content: { type: 'string' },
    authorId: { type: 'string', nullable: true },
    authorName: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const AnalysisSchema = {
  type: 'object' as const,
  properties: {
    totalVendors: { type: 'integer', example: 5 },
    activeVendors: { type: 'integer', example: 3 },
    inactiveVendors: { type: 'integer', example: 2 },
    complianceRiskCount: { type: 'integer', example: 3 },
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
    vendorCode: { type: 'string', nullable: true, example: 'av-2026-195' },
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

// ─── Vendor responses ───────────────────────────────────────

export const VendorCreatedResponse = wrapSuccess(VendorCreatedDataSchema);
export const VendorListResponse = wrapSuccess({
  type: 'object',
  properties: {
    analysis: AnalysisSchema,
    items: { type: 'array', items: VendorSchema },
    meta: PaginationMeta,
  },
});
export const VendorDetailResponse = wrapSuccess(VendorSchema);
export const VendorUpdatedResponse = wrapSuccess(VendorSchema);
export const VendorDeletedResponse = wrapSuccess(DeletedRefSchema);

// ─── Bank responses ─────────────────────────────────────────

export const BankSavedResponse = wrapSuccess(BankSchema);
export const BankRemovedResponse = wrapSuccess({
  type: 'object',
  properties: { vendorId: { type: 'string' } },
});

// ─── Note responses ─────────────────────────────────────────

export const NoteCreatedResponse = wrapSuccess(NoteSchema);
export const NoteListResponse = wrapSuccess({ type: 'array', items: NoteSchema });
export const NoteDeletedResponse = wrapSuccess({
  type: 'object',
  properties: { id: { type: 'string' } },
});

// ─── Document responses ─────────────────────────────────────

export const DocumentUploadedResponse = wrapSuccess(DocumentSchema);
export const DocumentStatusUpdatedResponse = wrapSuccess(DocumentSchema);
export const DocumentDeletedResponse = wrapSuccess({
  type: 'object',
  properties: { id: { type: 'string' } },
});

// ─── Compliance response ────────────────────────────────────

export const ComplianceUpdatedResponse = wrapSuccess(VendorSchema);

// ─── Body schemas ───────────────────────────────────────────

export const UploadDocumentBody = {
  type: 'object' as const,
  properties: {
    documentType: { type: 'string', example: 'TIN' },
    label: { type: 'string', example: 'Tax ID Certificate' },
    image: { type: 'string', format: 'binary' },
  },
  required: ['documentType', 'label'],
};
