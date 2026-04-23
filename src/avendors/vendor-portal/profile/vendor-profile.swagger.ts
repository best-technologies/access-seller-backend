/**
 * Swagger response schemas for the vendor portal /vendor/profile endpoints.
 */

const SuccessEnvelope = (dataSchema: Record<string, unknown>) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: dataSchema,
    statusCode: { type: 'integer', example: 200 },
  },
});

const CompanySchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', example: 'av-2026-423' },
    name: { type: 'string', example: 'Global Supplies Ltd' },
    email: { type: 'string', example: 'contact@globalsupplies.com' },
    phone: { type: 'string', nullable: true, example: '+2348161252897' },
    industry: { type: 'string', nullable: true, example: 'Industrial Equipment' },
    address: { type: 'string', nullable: true, example: '12 Adeola Odeku Street' },
    city: { type: 'string', nullable: true, example: 'Lagos' },
    country: { type: 'string', nullable: true, example: 'Nigeria' },
    status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
    complianceStatus: {
      type: 'string',
      enum: ['compliant', 'non_compliant', 'warning'],
      example: 'compliant',
    },
    rating: { type: 'number', nullable: true, example: 4.8 },
    totalOrders: { type: 'integer', example: 12 },
    totalSpend: { type: 'number', example: 3500000 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const UserCardSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    email: { type: 'string', example: 'owner@globalsupplies.com' },
    firstName: { type: 'string', example: 'Aisha' },
    lastName: { type: 'string', example: 'Okafor' },
    phone: { type: 'string', nullable: true, example: '+2348012345678' },
    displayPicture: { type: 'string', nullable: true, example: 'https://cdn.example/.../user.jpg' },
    companyPosition: { type: 'string', nullable: true, example: 'Procurement Lead' },
  },
};

const BankSchema = {
  type: 'object' as const,
  nullable: true,
  properties: {
    id: { type: 'string' },
    bankName: { type: 'string', example: 'First Bank Nigeria' },
    accountNumber: { type: 'string', example: '2033445566' },
    accountName: { type: 'string', example: 'Dangote Industries Ltd' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const ComplianceDocSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    documentType: { type: 'string', example: 'TIN' },
    label: { type: 'string', example: 'Tax ID Certificate' },
    imageUrl: { type: 'string', nullable: true, example: 'https://cdn.example/.../doc.pdf' },
    status: {
      type: 'string',
      enum: ['valid', 'expired', 'pending'],
      example: 'valid',
    },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const ProfileCompletionSchema = {
  type: 'object' as const,
  properties: {
    completionPercent: { type: 'integer', example: 70 },
    completedItems: {
      type: 'array',
      items: { type: 'string' },
      example: ['company_basic', 'bank_details'],
    },
    missingItems: {
      type: 'array',
      items: { type: 'string' },
      example: ['company_address', 'compliance_valid'],
    },
  },
};

export const VendorProfileAggregateResponse = SuccessEnvelope({
  type: 'object',
  properties: {
    user: UserCardSchema,
    company: CompanySchema,
    bank: BankSchema,
    compliance: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['compliant', 'non_compliant', 'warning'],
          example: 'compliant',
        },
        documents: { type: 'array', items: ComplianceDocSchema },
      },
    },
    security: {
      type: 'object',
      properties: { hasPassword: { type: 'boolean', example: true } },
    },
    profileCompletion: ProfileCompletionSchema,
  },
});

export const VendorCompanyUpdatedResponse = SuccessEnvelope(CompanySchema);
export const VendorBankSavedResponse = SuccessEnvelope(BankSchema);
export const VendorBankRemovedResponse = SuccessEnvelope({
  type: 'object',
  properties: { vendorId: { type: 'string' } },
});
export const VendorDocumentSavedResponse = SuccessEnvelope(ComplianceDocSchema);
export const VendorDocumentDeletedResponse = SuccessEnvelope({
  type: 'object',
  properties: { id: { type: 'string' } },
});
export const VendorPasswordChangedResponse = SuccessEnvelope({
  type: 'object',
  properties: { id: { type: 'string' } },
});

export const UploadComplianceBody = {
  schema: {
    type: 'object',
    required: ['documentType', 'label', 'image'],
    properties: {
      documentType: { type: 'string', example: 'TIN' },
      label: { type: 'string', example: 'Tax ID Certificate' },
      expiresAt: { type: 'string', format: 'date', example: '2026-12-31' },
      image: { type: 'string', format: 'binary' },
    },
  },
};

export const UpdateComplianceBody = {
  schema: {
    type: 'object',
    properties: {
      documentType: { type: 'string', example: 'CAC' },
      label: { type: 'string', example: 'Certificate of Incorporation' },
      expiresAt: { type: 'string', format: 'date', example: '2026-12-31' },
      image: { type: 'string', format: 'binary' },
    },
  },
};

export const ErrorResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Something went wrong' },
    statusCode: { type: 'integer', example: 400 },
  },
};
