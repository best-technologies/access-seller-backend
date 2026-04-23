/**
 * Swagger response schemas for the /vendor/dashboard endpoints.
 */

const RecentQuoteRequestSchema = {
  type: 'object' as const,
  properties: {
    rfqId: { type: 'string' },
    reference: { type: 'string', example: 'RFQ-00043' },
    title: { type: 'string', example: 'PPE bulk procurement — Q2' },
    itemsCount: { type: 'integer', example: 5 },
    expectedDelivery: { type: 'string', format: 'date-time' },
    submissionDeadline: { type: 'string', format: 'date-time' },
    status: {
      type: 'string',
      enum: ['draft', 'sent', 'awaiting_selection', 'awarded', 'cancelled'],
    },
    sentAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

export const DashboardSummaryResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Dashboard summary retrieved' },
    data: {
      type: 'object',
      properties: {
        kpis: {
          type: 'object',
          properties: {
            activeQuoteRequests: { type: 'integer', example: 4 },
            acceptedQuotes: { type: 'integer', example: 2 },
            totalInventory: { type: 'integer', example: 87 },
            totalApprovedPayment: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 3500000 },
                currency: { type: 'string', example: 'NGN' },
              },
            },
          },
        },
        profileBanner: {
          type: 'object',
          properties: {
            completionPercent: { type: 'integer', example: 70 },
            missingItems: { type: 'array', items: { type: 'string' } },
            completedItems: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' },
            ctaLabel: { type: 'string', example: 'Complete profile' },
          },
        },
        recentQuoteRequests: {
          type: 'array',
          items: RecentQuoteRequestSchema,
        },
        greeting: {
          type: 'object',
          properties: {
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            companyName: { type: 'string', nullable: true },
          },
        },
      },
    },
    statusCode: { type: 'integer', example: 200 },
  },
};

export const DashboardErrorResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    statusCode: { type: 'integer', example: 403 },
  },
};
