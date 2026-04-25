/**
 * OpenAPI schemas for `/vendor/quotes-history/*`. Consumed by
 * `./endpoint-decorators.ts` and re-exported through the barrel file.
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
    tabs: {
      type: 'object',
      properties: {
        all: { type: 'integer', example: 21 },
        awarded: { type: 'integer', example: 12 },
        pending: { type: 'integer', example: 3 },
        rejected: { type: 'integer', example: 4 },
        withdrawn: { type: 'integer', example: 2 },
      },
    },
  },
};

const FulfillmentSummary = {
  type: 'object' as const,
  nullable: true,
  properties: {
    stage: {
      type: 'string',
      enum: ['created', 'in_production', 'in_transit', 'delivered', 'cancelled'],
    },
    stageLabel: { type: 'string', example: 'In Production' },
    shippedAt: { type: 'string', format: 'date-time', nullable: true },
    deliveredAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const QuoteHistoryListItem = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    quoteNumber: { type: 'string', example: 'QT-2026-0001' },
    reference: { type: 'string', example: 'RFQ-2026-0042' },
    title: { type: 'string', example: 'Textbook paper cover' },
    status: {
      type: 'string',
      enum: ['submitted', 'withdrawn', 'accepted', 'rejected'],
    },
    displayStatus: {
      type: 'string',
      enum: ['Awarded', 'Pending', 'Rejected', 'Withdrawn'],
    },
    totalItems: { type: 'integer', example: 3 },
    acceptedItems: { type: 'integer', example: 2 },
    totalPriceOptions: { type: 'integer', example: 5 },
    amountQuoted: { type: 'number', example: 2260000 },
    currency: { type: 'string', example: 'NGN' },
    dateSubmitted: { type: 'string', format: 'date-time', nullable: true },
    expectedDelivery: { type: 'string', format: 'date-time', nullable: true },
    rfqId: { type: 'string' },
    rfqStatus: {
      type: 'string',
      enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'],
    },
    fulfillment: FulfillmentSummary,
  },
};

export const QuotesHistoryListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quotes history retrieved' },
    data: { type: 'array', items: QuoteHistoryListItem },
    meta: PaginationMeta,
    statusCode: { type: 'integer', example: 200 },
  },
};

const PriceOption = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    position: { type: 'integer' },
    quality: { type: 'string', nullable: true, example: '98%' },
    possibleDeliveryAt: { type: 'string', format: 'date-time', nullable: true },
    pricePerUnit: { type: 'number', example: 750 },
    totalPrice: { type: 'number', example: 750000 },
    note: { type: 'string', nullable: true },
    decision: {
      type: 'string',
      enum: ['pending', 'accepted', 'rejected'],
    },
    decisionLabel: {
      type: 'string',
      enum: ['Accepted quote', 'Rejected quote', 'Pending decision'],
    },
    decisionNote: { type: 'string', nullable: true },
    decisionAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const DetailItem = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    materialId: { type: 'string', nullable: true },
    materialName: { type: 'string', example: '80 GSM Woodfree Paper (A4)' },
    quantity: { type: 'number', example: 1000 },
    unit: { type: 'string', example: 'unit' },
    description: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          imageUrl: { type: 'string' },
          originalFilename: { type: 'string', nullable: true },
        },
      },
    },
    priceOptions: { type: 'array', items: PriceOption },
  },
};

export const QuotesHistoryDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Quote detail retrieved' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        quoteNumber: { type: 'string', example: 'QT-2026-0035' },
        status: {
          type: 'string',
          enum: ['submitted', 'withdrawn', 'accepted', 'rejected'],
        },
        displayStatus: {
          type: 'string',
          enum: ['Awarded', 'Pending', 'Rejected', 'Withdrawn'],
        },
        currency: { type: 'string', example: 'NGN' },
        totalAmount: { type: 'number', example: 2260000 },
        note: { type: 'string', nullable: true },
        submittedAt: { type: 'string', format: 'date-time', nullable: true },
        withdrawnAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        rfq: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rfqNumber: { type: 'string', example: 'RFQ-2026-0035' },
            title: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'draft',
                'sent',
                'awaiting_selection',
                'awarded',
                'cancelled',
              ],
            },
            expectedDelivery: { type: 'string', format: 'date-time' },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 3 },
            totalPriceOptions: { type: 'integer', example: 5 },
            acceptedItems: { type: 'integer', example: 2 },
            acceptedLines: { type: 'integer', example: 2 },
            totalQuoted: { type: 'number', example: 2260000 },
            expectedDelivery: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            dateSubmitted: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
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
        items: { type: 'array', items: DetailItem },
        order: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string' },
            stage: {
              type: 'string',
              enum: [
                'created',
                'in_production',
                'in_transit',
                'delivered',
                'cancelled',
              ],
            },
            stageLabel: { type: 'string', example: 'In Production' },
            expectedDeliveryAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

/**
 * Timeline entries are one of two shapes (discriminated on `type`). We
 * describe the union as a single object schema with every field optional
 * rather than `oneOf` — simpler for the TS types, still correct as an
 * OpenAPI description.
 */
const TimelineEntry = {
  type: 'object' as const,
  properties: {
    type: { type: 'string', enum: ['stage', 'payment'] },
    stage: {
      type: 'string',
      nullable: true,
      enum: [
        'created',
        'in_production',
        'in_transit',
        'delivered',
        'cancelled',
      ],
    },
    label: { type: 'string', example: 'In Production' },
    occurredAt: { type: 'string', format: 'date-time', nullable: true },
    state: {
      type: 'string',
      enum: ['done', 'active', 'pending'],
      example: 'active',
    },
    id: { type: 'string', nullable: true },
    percentage: { type: 'integer', nullable: true, example: 50 },
    amount: { type: 'number', nullable: true, example: 1130000 },
    currency: { type: 'string', nullable: true, example: 'NGN' },
    approvedAt: { type: 'string', format: 'date-time', nullable: true },
    hasProof: { type: 'boolean', nullable: true, example: true },
  },
};

const PaymentRecord = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' },
    label: { type: 'string', nullable: true, example: '50% Upfront' },
    percentage: { type: 'integer', nullable: true, example: 50 },
    amount: { type: 'number', example: 1130000 },
    currency: { type: 'string', example: 'NGN' },
    status: { type: 'string', enum: ['pending', 'approved'] },
    approvedAt: { type: 'string', format: 'date-time', nullable: true },
    reference: { type: 'string', nullable: true },
    proof: {
      type: 'object',
      nullable: true,
      properties: {
        url: { type: 'string', example: 'https://cdn…/payment_50pct.png' },
        publicId: { type: 'string', nullable: true },
        originalFilename: {
          type: 'string',
          nullable: true,
          example: 'Payment_Receipt_50pct.img',
        },
      },
    },
  },
};

export const FulfillmentTimelineResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: {
      type: 'string',
      example: 'Order fulfillment timeline retrieved',
    },
    data: {
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            quoteId: { type: 'string' },
            stage: {
              type: 'string',
              enum: [
                'created',
                'in_production',
                'in_transit',
                'delivered',
                'cancelled',
              ],
            },
            stageLabel: { type: 'string', example: 'In Production' },
            expectedDeliveryAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            productionStartedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            shippedAt: { type: 'string', format: 'date-time', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            note: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        timeline: { type: 'array', items: TimelineEntry },
        payments: { type: 'array', items: PaymentRecord },
        totals: {
          type: 'object',
          properties: {
            totalQuoted: { type: 'number', example: 2260000 },
            totalApproved: { type: 'number', example: 1130000 },
            outstanding: { type: 'number', example: 1130000 },
            currency: { type: 'string', example: 'NGN' },
          },
        },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

export const FulfillmentStageUpdatedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Fulfillment stage updated' },
    data: {
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            quoteId: { type: 'string' },
            stage: {
              type: 'string',
              enum: [
                'created',
                'in_production',
                'in_transit',
                'delivered',
                'cancelled',
              ],
            },
            stageLabel: { type: 'string' },
            expectedDeliveryAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            productionStartedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            shippedAt: { type: 'string', format: 'date-time', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            note: { type: 'string', nullable: true },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};
