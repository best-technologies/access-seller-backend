/**
 * Swagger response schemas for A-Vendor RFQ endpoints.
 */

const AttachmentSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    imageUrl: { type: 'string' },
    imagePublicId: { type: 'string' },
    originalFilename: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const MaterialRefSchema = {
  type: 'object' as const,
  nullable: true,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'A4 Paper (80gsm)' },
    unit: { type: 'string', example: 'Box' },
    pricePerUnit: { type: 'number', example: 750 },
  },
};

const RfqItemSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    rfqId: { type: 'string' },
    materialId: { type: 'string', example: 'clxyz1234567890' },
    materialName: { type: 'string', example: 'A4 Paper (80gsm)', description: 'Auto-resolved from material' },
    quantity: { type: 'number', example: 1000 },
    unit: { type: 'string', example: 'Box' },
    budget: { type: 'number', example: 750000 },
    description: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    attachments: { type: 'array', items: AttachmentSchema },
    material: MaterialRefSchema,
  },
};

const VendorRefSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'Prima Print Solutions' },
    email: { type: 'string', example: 'contact@prima.com' },
    rating: { type: 'number', nullable: true, example: 4.8 },
    status: { type: 'string', enum: ['active', 'inactive'] },
  },
};

const RfqVendorSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    rfqId: { type: 'string' },
    vendorId: { type: 'string' },
    sentAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    vendor: VendorRefSchema,
  },
};

const RfqSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'clxyz1234567890' },
    rfqNumber: { type: 'string', example: 'RFQ-2026-0001' },
    title: { type: 'string', example: 'Textbook production' },
    description: { type: 'string', nullable: true },
    dueDate: { type: 'string', format: 'date-time' },
    status: {
      type: 'string',
      enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'],
      example: 'draft',
    },
    totalBudget: { type: 'number', example: 750000 },
    sentAt: { type: 'string', format: 'date-time', nullable: true },
    createdById: { type: 'string' },
    createdByName: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: { type: 'array', items: RfqItemSchema },
    vendors: { type: 'array', items: RfqVendorSchema },
    attachments: { type: 'array', items: AttachmentSchema },
  },
};

const RfqListItemSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    rfqNumber: { type: 'string', example: 'RFQ-2026-0001' },
    title: { type: 'string', example: 'Textbook production' },
    description: { type: 'string', nullable: true },
    dueDate: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'] },
    totalBudget: { type: 'number' },
    sentAt: { type: 'string', format: 'date-time', nullable: true },
    createdById: { type: 'string' },
    createdByName: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    _count: {
      type: 'object',
      properties: {
        items: { type: 'integer', example: 5 },
        vendors: { type: 'integer', example: 3 },
      },
    },
  },
};

const AnalysisSchema = {
  type: 'object' as const,
  properties: {
    totalRfqs: { type: 'integer', example: 21 },
    draftCount: { type: 'integer', example: 3 },
    sentCount: { type: 'integer', example: 5 },
    awardedCount: { type: 'integer', example: 12 },
  },
};

const PaginationMeta = {
  type: 'object' as const,
  properties: {
    total: { type: 'integer', example: 21 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 2 },
    hasNextPage: { type: 'boolean', example: true },
    hasPrevPage: { type: 'boolean', example: false },
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

const MaterialCatalogMaterialSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'A4 Paper (80gsm)' },
    categoryId: { type: 'string' },
    unit: { type: 'string', example: 'Box' },
    pricePerUnit: { type: 'number', example: 750 },
    stock: { type: 'integer', example: 200 },
    imageUrl: { type: 'string', nullable: true },
  },
};

const MaterialCatalogCategorySchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'Print Paper' },
    description: { type: 'string', nullable: true },
    materials: { type: 'array', items: MaterialCatalogMaterialSchema },
  },
};

/** Nested categories + materials for RFQ create UI dropdowns. */
export const MaterialCatalogResponse = wrapSuccess({
  type: 'array',
  items: MaterialCatalogCategorySchema,
});

// ─── RFQ responses ──────────────────────────────────────────

export const RfqCreatedResponse = wrapSuccess(RfqSchema);

export const RfqListResponse = wrapSuccess({
  type: 'object',
  properties: {
    analysis: AnalysisSchema,
    items: { type: 'array', items: RfqListItemSchema },
    meta: PaginationMeta,
  },
});

export const RfqDetailResponse = wrapSuccess(RfqSchema);
export const RfqUpdatedResponse = wrapSuccess(RfqSchema);
export const RfqDeletedResponse = wrapSuccess({
  type: 'object',
  properties: {
    id: { type: 'string' },
    rfqNumber: { type: 'string' },
  },
});

// ─── Item responses ─────────────────────────────────────────

export const ItemAddedResponse = wrapSuccess(RfqItemSchema);
export const ItemUpdatedResponse = wrapSuccess(RfqItemSchema);
export const ItemDeletedResponse = wrapSuccess({
  type: 'object',
  properties: { id: { type: 'string' } },
});

// ─── Attachment responses ───────────────────────────────────

export const AttachmentsUploadedResponse = wrapSuccess({
  type: 'array',
  items: AttachmentSchema,
});
export const AttachmentDeletedResponse = wrapSuccess({
  type: 'object',
  properties: { id: { type: 'string' } },
});

// ─── Vendor assignment responses ────────────────────────────

export const VendorsAssignedResponse = wrapSuccess({
  type: 'array',
  items: RfqVendorSchema,
});
export const VendorRemovedResponse = wrapSuccess({
  type: 'object',
  properties: {
    rfqId: { type: 'string' },
    vendorId: { type: 'string' },
  },
});

// ─── Send response ──────────────────────────────────────────

export const RfqSentResponse = wrapSuccess(RfqSchema);

// ─── Body schemas ───────────────────────────────────────────

export const UploadAttachmentsBody = {
  type: 'object' as const,
  properties: {
    images: {
      type: 'array',
      items: { type: 'string', format: 'binary' },
      maxItems: 10,
    },
  },
  required: ['images'],
};
