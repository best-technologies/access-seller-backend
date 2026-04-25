/**
 * Composed Swagger decorators for every `/vendor/quotes-history/*` endpoint.
 * Keeps the controller method signatures readable — each endpoint gets one
 * `@ApiDocXxx()` decorator that bundles the operation summary, params,
 * success + error responses.
 */
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { VendorQuoteHistoryView } from '../dto/list-quotes-history-query.dto';
import { UpdateVendorFulfillmentStageDto } from '../dto/update-fulfillment-stage.dto';
import {
  ErrorResponse,
  FulfillmentStageUpdatedResponse,
  FulfillmentTimelineResponse,
  QuotesHistoryDetailResponse,
  QuotesHistoryListResponse,
} from './schemas';

export const ApiDocListQuotesHistory = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List submitted quotes (history)',
      description:
        "Paginated list of every quote the supplier has ever submitted, powering the Quotes History screen. Use `view` to drive the `All / Awarded / Pending` tabs. Each row surfaces the RFQ reference, item counts, accepted-item count (from per-line admin decisions), the quoted total, submission date, and current fulfillment stage (when the quote has been awarded). The response `meta.tabs` block returns the same counts used by the UI tab chips so a single roundtrip is enough.",
    }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'RFQ number, RFQ title, or quote number (case-insensitive)',
    }),
    ApiQuery({
      name: 'view',
      required: false,
      enum: VendorQuoteHistoryView,
      description: '`all` (default) / `awarded` / `pending`',
    }),
    ApiResponse({
      status: 200,
      description: 'Quotes history retrieved',
      schema: QuotesHistoryListResponse,
    }),
    ApiResponse({
      status: 403,
      description: 'Not a linked supplier account',
      schema: ErrorResponse,
    }),
  );

export const ApiDocGetQuoteHistoryDetail = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get a submitted quote (overview tab)',
      description:
        "Returns the full detail payload for a single submitted quote: header summary (total items, date submitted, total quoted, expected delivery), the RFQ's requested items grouped with the vendor's own price options, and the per-line admin decisions (`Accepted quote` / `Rejected quote` / pending). If the quote has been awarded and no order row exists yet, one is created on-the-fly so the Order Fulfillment tab has something to render.",
    }),
    ApiParam({ name: 'quoteId', description: 'Vendor quote id (cuid)' }),
    ApiResponse({
      status: 200,
      description: 'Quote detail retrieved',
      schema: QuotesHistoryDetailResponse,
    }),
    ApiResponse({
      status: 404,
      description: 'Quote not found or not owned by your account',
      schema: ErrorResponse,
    }),
  );

export const ApiDocGetFulfillmentTimeline = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get order fulfillment timeline',
      description:
        "Returns the merged timeline of stage transitions (`Order Created` → `In Production` → `In Transit` → `Delivered`) interleaved with payment-approval events (`50% Payment Approved`). Each stage entry carries a `state` of `done`, `active`, or `pending` so the UI can light up the right marker without recomputing. Payment entries carry `hasProof: true` when the admin has attached a receipt; fetch the full proof via the `payments[].proof.url`. Only available for quotes with status `accepted`.",
    }),
    ApiParam({ name: 'quoteId', description: 'Vendor quote id (cuid)' }),
    ApiResponse({
      status: 200,
      description: 'Order fulfillment timeline retrieved',
      schema: FulfillmentTimelineResponse,
    }),
    ApiResponse({
      status: 400,
      description: 'Quote has not been awarded yet',
      schema: ErrorResponse,
    }),
    ApiResponse({
      status: 404,
      description: 'Quote not found or not owned by your account',
      schema: ErrorResponse,
    }),
  );

export const ApiDocUpdateFulfillmentStage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update order fulfillment stage',
      description:
        "Moves the order forward to the supplied `stage`. Allowed transitions: `created → in_production`, `in_production → in_transit`, `in_transit → delivered`. Backward transitions are rejected, and once an order is `delivered` or `cancelled` the endpoint returns 409. Stage timestamps (`productionStartedAt`, `shippedAt`, `deliveredAt`) are back-filled so the timeline stays consistent when a vendor jumps two stages at once.",
    }),
    ApiParam({ name: 'quoteId', description: 'Vendor quote id (cuid)' }),
    ApiBody({ type: UpdateVendorFulfillmentStageDto }),
    ApiResponse({
      status: 200,
      description: 'Fulfillment stage updated',
      schema: FulfillmentStageUpdatedResponse,
    }),
    ApiResponse({
      status: 400,
      description: 'Illegal stage transition or quote not awarded',
      schema: ErrorResponse,
    }),
    ApiResponse({
      status: 404,
      description: 'Quote not found or not owned by your account',
      schema: ErrorResponse,
    }),
    ApiResponse({
      status: 409,
      description: 'Order already delivered / cancelled',
      schema: ErrorResponse,
    }),
  );
