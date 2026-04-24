/**
 * OpenAPI schemas for `/vendor/quote-requests/*`. Consumed by
 * `./endpoint-decorators.ts` and the controller via the barrel file.
 */

export const ErrorResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    statusCode: { type: 'integer' },
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

const PlanSummary = {
  type: 'object' as const,
  nullable: true,
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'NET 30' },
    code: { type: 'string', nullable: true, example: 'NET30' },
  },
};

const MyQuoteSummary = {
  type: 'object' as const,
  nullable: true,
  properties: {
    id: { type: 'string' },
    quoteNumber: { type: 'string', example: 'QT-2026-0001' },
    status: {
      type: 'string',
      enum: ['draft', 'submitted', 'withdrawn', 'accepted', 'rejected'],
    },
    totalAmount: { type: 'number', example: 872000 },
    currency: { type: 'string', example: 'NGN' },
    submittedAt: { type: 'string', format: 'date-time', nullable: true },
    updatedAt: { type: 'string', format: 'date-time' },
    paymentPlan: PlanSummary,
  },
};

export const PaymentPlanListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Payment plans retrieved' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          netDays: { type: 'integer', nullable: true },
          sortOrder: { type: 'integer' },
        },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

const QuoteRequestListItem = {
  type: 'object' as const,
  properties: {
    assignmentId: { type: 'string' },
    rfqId: { type: 'string' },
    reference: { type: 'string', example: 'RFQ-2026-0042' },
    title: { type: 'string', example: 'Textbook paper cover' },
    description: { type: 'string', nullable: true },
    itemsCount: { type: 'integer', example: 3 },
    expectedDelivery: { type: 'string', format: 'date-time' },
    submissionDeadline: { type: 'string', format: 'date-time' },
    rfqStatus: {
      type: 'string',
      enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'],
    },
    totalBudget: { type: 'number', example: 6750000 },
    sentAt: { type: 'string', format: 'date-time', nullable: true },
    myQuote: MyQuoteSummary,
  },
};

export const QuoteRequestsListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote requests retrieved' },
    data: { type: 'array', items: QuoteRequestListItem },
    meta: PaginationMeta,
    statusCode: { type: 'integer', example: 200 },
  },
};

const RfqAttachment = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    imageUrl: { type: 'string' },
    originalFilename: { type: 'string', nullable: true },
  },
};

const RequestedItem = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    materialId: { type: 'string', nullable: true },
    materialName: { type: 'string', example: '80 GSM Woodfree Paper (A4)' },
    quantity: { type: 'number', example: 500 },
    unit: { type: 'string', example: 'Reams' },
    budget: { type: 'number', example: 225000 },
    description: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    attachments: { type: 'array', items: RfqAttachment },
  },
};

const QuoteLinePrice = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    position: { type: 'integer' },
    quality: { type: 'string', nullable: true, example: '98%' },
    possibleDeliveryAt: { type: 'string', format: 'date-time', nullable: true },
    pricePerUnit: { type: 'number', example: 750 },
    totalPrice: { type: 'number', example: 750000 },
    note: { type: 'string', nullable: true },
  },
};

const MyQuote = {
  type: 'object' as const,
  nullable: true,
  properties: {
    id: { type: 'string' },
    quoteNumber: { type: 'string', example: 'QT-2026-0001' },
    status: {
      type: 'string',
      enum: ['draft', 'submitted', 'withdrawn', 'accepted', 'rejected'],
    },
    currency: { type: 'string', example: 'NGN' },
    totalAmount: { type: 'number', example: 872000 },
    note: { type: 'string', nullable: true },
    submittedAt: { type: 'string', format: 'date-time', nullable: true },
    withdrawnAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    paymentPlan: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        code: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        netDays: { type: 'integer', nullable: true },
      },
    },
    paymentPlanSetBy: {
      type: 'string',
      nullable: true,
      enum: ['vendor', 'admin'],
    },
    paymentPlanSetAt: { type: 'string', format: 'date-time', nullable: true },
    itemQuotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rfqItemId: { type: 'string' },
          prices: { type: 'array', items: QuoteLinePrice },
        },
      },
    },
  },
};

export const QuoteRequestDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote request retrieved' },
    data: {
      type: 'object',
      properties: {
        rfq: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rfqNumber: { type: 'string', example: 'RFQ-2026-0042' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'],
            },
            totalBudget: { type: 'number' },
            expectedDelivery: { type: 'string', format: 'date-time' },
            submissionDeadline: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            attachments: { type: 'array', items: RfqAttachment },
          },
        },
        items: { type: 'array', items: RequestedItem },
        summary: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 3 },
            totalAmount: { type: 'number', example: 6750000 },
            currency: { type: 'string', example: 'NGN' },
          },
        },
        quote: MyQuote,
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

export const QuoteSubmittedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote submitted' },
    data: MyQuote,
    statusCode: { type: 'integer', example: 201 },
  },
};

export const QuoteUpdatedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote updated' },
    data: MyQuote,
    statusCode: { type: 'integer', example: 200 },
  },
};

export const QuoteWithdrawnResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote withdrawn' },
    data: MyQuote,
    statusCode: { type: 'integer', example: 200 },
  },
};

export const SubmitQuoteExamples = {
  singlePricePerItem: {
    summary: 'One price per item',
    value: {
      currency: 'NGN',
      note: 'All prices VAT-inclusive.',
      lines: [
        {
          rfqItemId: '<rfq-item-id-1>',
          quality: '100%',
          possibleDeliveryAt: '2026-02-19',
          pricePerUnit: 450,
          totalPrice: 225000,
        },
      ],
    },
  },
  multipleTiersPerItem: {
    summary: 'Multiple quality tiers per item',
    value: {
      currency: 'NGN',
      note: 'Lead time starts from PO confirmation.',
      lines: [
        {
          rfqItemId: '<rfq-item-id-1>',
          position: 0,
          quality: '100%',
          possibleDeliveryAt: '2026-02-19',
          pricePerUnit: 750,
          totalPrice: 375000,
        },
        {
          rfqItemId: '<rfq-item-id-1>',
          position: 1,
          quality: '80%',
          possibleDeliveryAt: '2026-02-12',
          pricePerUnit: 520,
          totalPrice: 260000,
          note: 'Slightly off-white stock, bulk discount.',
        },
        {
          rfqItemId: '<rfq-item-id-2>',
          quality: 'Grade A',
          pricePerUnit: 45,
          totalPrice: 90000,
        },
      ],
    },
  },
};
