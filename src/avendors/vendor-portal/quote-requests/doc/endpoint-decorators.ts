/**
 * Composed Swagger decorators for every `/vendor/quote-requests/*` endpoint.
 */
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VendorQuoteRequestView } from '../dto/list-quote-requests-query.dto';
import { SetVendorQuotePaymentPlanBodyDto } from 'src/avendors/shared/dto/set-vendor-quote-payment-plan.dto';
import { SubmitVendorQuoteDto } from '../dto/submit-quote.dto';
import {
  ErrorResponse,
  PaymentPlanListResponse,
  QuoteRequestDetailResponse,
  QuoteRequestsListResponse,
  QuoteSubmittedResponse,
  QuoteUpdatedResponse,
  QuoteWithdrawnResponse,
  SubmitQuoteExamples,
} from './schemas';

export const ApiDocListQuoteRequests = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List quote requests',
      description:
        'Paginated list of RFQs assigned to the authenticated supplier. By default (`view=active`) shows everything that still needs attention (`sent` + `awaiting_selection`). Use `view=open` to filter to RFQs not yet quoted, or `view=submitted` to see quotes already sent and awaiting a decision. Each row includes the vendor\'s own quote summary when one exists.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'view', required: false, enum: VendorQuoteRequestView }),
    ApiResponse({ status: 200, description: 'Quote requests retrieved', schema: QuoteRequestsListResponse }),
    ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse }),
  );

export const ApiDocListPaymentPlans = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List active payment plans (dropdown)',
      description:
        'Read-only list of `AvendorPaymentPlan` rows with `isActive: true` for the quote submission UI. The catalog is defined by A-Vendor staff (`GET /avendor/payment-plans`). This route is under `quote-requests` so the frontend can co-locate fetches. **Note:** attaching “payment proof” is not part of the quote flow in this product — that belongs to invoicing or payments, not to RFQ submission.',
    }),
    ApiResponse({ status: 200, description: 'Active plans', schema: PaymentPlanListResponse }),
  );

export const ApiDocGetQuoteRequest = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get a quote request (RFQ detail)',
      description:
        'Returns the RFQ header, the requested items (including first attachment as `imageUrl`), a computed total, and the vendor\'s own quote if already submitted. Groups the vendor\'s price options by RFQ item under `quote.itemQuotes[]` so the UI can render the "Add another price" tiers straight from the payload.',
    }),
    ApiParam({ name: 'rfqId', description: 'RFQ id (cuid)' }),
    ApiResponse({ status: 200, description: 'Quote request retrieved', schema: QuoteRequestDetailResponse }),
    ApiResponse({
      status: 404,
      description: 'RFQ not found or not assigned to your account',
      schema: ErrorResponse,
    }),
  );

export const ApiDocSubmitQuote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Submit or resubmit a quote',
      description:
        'Creates the vendor\'s quote on first call, or fully replaces the existing one on subsequent calls (all lines are deleted and recreated). A vendor can send multiple lines for the same `rfqItemId` to offer quality tiers. Optional `paymentPlanId` selects an active payment plan; resubmit may omit the field to keep the current plan, or set `null` to clear. Allowed while RFQ status is `sent` or `awaiting_selection` and the current quote is not already `accepted`/`rejected`. Successfully submitting also promotes the RFQ to `awaiting_selection` if still in `sent`.',
    }),
    ApiParam({ name: 'rfqId', description: 'RFQ id (cuid)' }),
    ApiBody({ type: SubmitVendorQuoteDto, examples: SubmitQuoteExamples }),
    ApiResponse({ status: 201, description: 'Quote submitted', schema: QuoteSubmittedResponse }),
    ApiResponse({ status: 200, description: 'Quote updated (resubmit)', schema: QuoteUpdatedResponse }),
    ApiResponse({
      status: 400,
      description: 'Invalid line, wrong RFQ item, or RFQ is no longer quotable',
      schema: ErrorResponse,
    }),
    ApiResponse({
      status: 403,
      description: 'RFQ not assigned to your account',
      schema: ErrorResponse,
    }),
    ApiResponse({ status: 404, description: 'RFQ not found', schema: ErrorResponse }),
    ApiResponse({
      status: 409,
      description: 'Quote is already accepted or rejected',
      schema: ErrorResponse,
    }),
  );

export const ApiDocWithdrawQuote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Withdraw a submitted quote',
      description:
        'Marks the vendor\'s quote as `withdrawn` (soft delete — lines are preserved). Allowed only while the RFQ is still `sent` / `awaiting_selection` and the quote is currently `submitted`.',
    }),
    ApiParam({ name: 'rfqId', description: 'RFQ id (cuid)' }),
    ApiResponse({ status: 200, description: 'Quote withdrawn', schema: QuoteWithdrawnResponse }),
    ApiResponse({
      status: 400,
      description: 'Quote not in a withdrawable state or RFQ closed',
      schema: ErrorResponse,
    }),
    ApiResponse({ status: 404, description: 'No quote on file', schema: ErrorResponse }),
  );

export const ApiDocSetPaymentPlan = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Set or clear payment plan on the quote (without resubmitting lines)',
      description:
        'Updates only the preferred payment plan. A-Vendor staff can set the same field via `PATCH /avendor/vendor-quotes/:quoteId/payment-plan` (last writer is stored in `paymentPlanSetBy`: `vendor` or `admin`).',
    }),
    ApiParam({ name: 'rfqId', description: 'RFQ id (cuid)' }),
    ApiBody({ type: SetVendorQuotePaymentPlanBodyDto }),
    ApiResponse({ status: 200, description: 'Plan updated', schema: QuoteUpdatedResponse }),
    ApiResponse({ status: 400, description: 'Invalid plan id or RFQ closed', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'No quote on file for this RFQ', schema: ErrorResponse }),
    ApiResponse({ status: 409, description: 'Quote is locked (accepted / rejected)', schema: ErrorResponse }),
  );
