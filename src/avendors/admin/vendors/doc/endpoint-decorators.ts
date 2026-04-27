/**
 * Per-endpoint Swagger decorator bundles for A-Vendor Vendors.
 * Each export returns a single composed decorator (via `applyDecorators`) so
 * the controller can stay purely route/handler code.
 */
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { CreateVendorNoteDto } from '../dto/create-vendor-note.dto';
import { UpdateComplianceDto } from '../dto/update-compliance.dto';
import { UpdateDocumentStatusDto } from '../dto/update-document-status.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { UpsertVendorBankDto } from '../dto/upsert-vendor-bank.dto';
import {
  BankRemovedResponse,
  BankSavedResponse,
  ComplianceUpdatedResponse,
  CreateVendorRequestExamples,
  DocumentDeletedResponse,
  DocumentStatusUpdatedResponse,
  DocumentUploadedResponse,
  ErrorResponse,
  NoteCreatedResponse,
  NoteDeletedResponse,
  NoteListResponse,
  UploadDocumentBody,
  VendorCreatedResponse,
  VendorDeletedResponse,
  VendorDetailResponse,
  VendorListResponse,
  VendorUpdatedResponse,
} from './schemas';

// ─── Vendor CRUD ──────────────────────────────────────────────

export const ApiDocCreateVendor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a vendor (onboard supplier)',
      description:
        'Creates an AvendorVendor row and a portal User, or links an existing User by email. ' +
        'Requires super_admin or full_access on A-Vendor vendors_management.\n\n' +
        '**Contact names (required):** either nested `user: { first_name, last_name }` **or** top-level `first_name` and `last_name` (flat JSON). If both are sent, nested `user` wins for name fields.\n\n' +
        '**Username:** optional on `user.username` or top-level `username`. If omitted, the server assigns a unique handle (`avd-YYYY-NNN`, e.g. `avd-2026-013`).\n\n' +
        '**New email:** new User with default password (response `defaultPassword`, `linkedExistingUser: false`). ' +
        '**Existing email** (user not yet linked to a supplier): link that user (`linkedExistingUser: true`, no `defaultPassword`). ' +
        '**409** if the user is already linked to a supplier.',
    }),
    ApiBody({ type: CreateVendorDto, examples: CreateVendorRequestExamples }),
    ApiResponse({ status: 201, description: 'Vendor created', schema: VendorCreatedResponse }),
    ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({
      status: 409,
      description: 'User already linked to a supplier',
      schema: ErrorResponse,
    }),
  );

export const ApiDocListVendors = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List vendors',
      description:
        'Paginated list with analysis cards (total, active, inactive, compliance risk). Requires at least view access.',
    }),
    ApiResponse({ status: 200, description: 'Paginated vendor list', schema: VendorListResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
  );

export const ApiDocGetVendor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get full vendor detail',
      description: 'Includes bank details, compliance documents, and notes. Requires at least view access.',
    }),
    ApiResponse({ status: 200, description: 'Vendor detail', schema: VendorDetailResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse }),
  );

export const ApiDocUpdateVendor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a vendor',
      description:
        'Partial update of the supplier (AvendorVendor) record: name, email, phone, address, status, rating, orders, spend, etc. Requires full_access. ' +
        '**Note:** `user` / portal-contact fields may appear on the generated request model but are **not applied** by this route; use A-Vendor user-management APIs to update the linked portal user.',
    }),
    ApiBody({ type: UpdateVendorDto }),
    ApiResponse({ status: 200, description: 'Vendor updated', schema: VendorUpdatedResponse }),
    ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse }),
  );

export const ApiDocDeleteVendor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a vendor',
      description:
        'Cascades bank, documents, notes. Cleans up document images from storage. Requires full_access.',
    }),
    ApiResponse({ status: 200, description: 'Vendor deleted', schema: VendorDeletedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse }),
  );

// ─── Bank ─────────────────────────────────────────────────────

export const ApiDocUpsertBank = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create or update vendor bank details',
      description: 'Upsert (creates if none, updates if exists). Requires full_access.',
    }),
    ApiBody({ type: UpsertVendorBankDto }),
    ApiResponse({ status: 200, description: 'Bank details saved', schema: BankSavedResponse }),
    ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse }),
  );

export const ApiDocDeleteBank = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remove vendor bank details',
      description: 'Requires full_access.',
    }),
    ApiResponse({ status: 200, description: 'Bank details removed', schema: BankRemovedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'No bank details found', schema: ErrorResponse }),
  );

// ─── Notes ────────────────────────────────────────────────────

export const ApiDocAddNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Add a note to a vendor',
      description: 'Captures caller as author. Requires full_access.',
    }),
    ApiBody({ type: CreateVendorNoteDto }),
    ApiResponse({ status: 201, description: 'Note added', schema: NoteCreatedResponse }),
    ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse }),
  );

export const ApiDocListNotes = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List notes for a vendor',
      description: 'Requires at least view access.',
    }),
    ApiResponse({ status: 200, description: 'Notes list', schema: NoteListResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse }),
  );

export const ApiDocDeleteNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a note',
      description: 'Requires full_access.',
    }),
    ApiResponse({ status: 200, description: 'Note deleted', schema: NoteDeletedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Note not found', schema: ErrorResponse }),
  );

// ─── Documents ────────────────────────────────────────────────

export const ApiDocUploadDocument = () =>
  applyDecorators(
    ApiBody({ description: 'Upload a compliance document with optional image.', schema: UploadDocumentBody }),
    ApiOperation({
      summary: 'Upload a compliance document',
      description:
        'Multipart form-data. Auto-recomputes vendor compliance status. Requires full_access.',
    }),
    ApiResponse({ status: 201, description: 'Document uploaded', schema: DocumentUploadedResponse }),
    ApiResponse({ status: 400, description: 'Validation error / bad file type', schema: ErrorResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse }),
  );

export const ApiDocUpdateDocumentStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update document status',
      description:
        'Set to valid, expired, or pending. Auto-recomputes vendor compliance. Requires full_access.',
    }),
    ApiBody({ type: UpdateDocumentStatusDto }),
    ApiResponse({ status: 200, description: 'Document status updated', schema: DocumentStatusUpdatedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse }),
  );

export const ApiDocDeleteDocument = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a compliance document',
      description:
        'Removes document and cleans up image from storage. Auto-recomputes compliance. Requires full_access.',
    }),
    ApiResponse({ status: 200, description: 'Document deleted', schema: DocumentDeletedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse }),
  );

// ─── Compliance override ──────────────────────────────────────

export const ApiDocUpdateCompliance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Manually override compliance status',
      description:
        'Sets complianceOverride=true so auto-recompute is skipped. Requires full_access.',
    }),
    ApiBody({ type: UpdateComplianceDto }),
    ApiResponse({ status: 200, description: 'Compliance status updated', schema: ComplianceUpdatedResponse }),
    ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse }),
    ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse }),
  );
