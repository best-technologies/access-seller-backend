import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorVendorsService } from './avendor-vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpsertVendorBankDto } from './dto/upsert-vendor-bank.dto';
import { CreateVendorNoteDto } from './dto/create-vendor-note.dto';
import { UploadVendorDocumentDto } from './dto/upload-vendor-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import {
  ErrorResponse,
  VendorCreatedResponse,
  VendorListResponse,
  VendorDetailResponse,
  VendorUpdatedResponse,
  VendorDeletedResponse,
  BankSavedResponse,
  BankRemovedResponse,
  NoteCreatedResponse,
  NoteListResponse,
  NoteDeletedResponse,
  DocumentUploadedResponse,
  DocumentStatusUpdatedResponse,
  DocumentDeletedResponse,
  ComplianceUpdatedResponse,
  UploadDocumentBody,
} from './avendor-vendors.swagger';

@ApiTags('A-Vendor — Vendors')
@ApiBearerAuth()
@Controller('avendor/vendors')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class AvendorVendorsController {
  constructor(private readonly service: AvendorVendorsService) {}

  // ─── VENDOR CRUD ──────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create a vendor',
    description: 'Requires super_admin or full_access on A-Vendor vendors_management.',
  })
  @ApiResponse({ status: 201, description: 'Vendor created', schema: VendorCreatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  createVendor(
    @Body() dto: CreateVendorDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.createVendor(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List vendors',
    description: 'Paginated list with analysis cards (total, active, inactive, compliance risk). Requires at least view access.',
  })
  @ApiResponse({ status: 200, description: 'Paginated vendor list', schema: VendorListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  listVendors(
    @Query() query: ListVendorsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listVendors(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full vendor detail',
    description: 'Includes bank details, compliance documents, and notes. Requires at least view access.',
  })
  @ApiResponse({ status: 200, description: 'Vendor detail', schema: VendorDetailResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  getVendor(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.getVendor(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a vendor',
    description: 'Update contact info, status, or performance fields. Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Vendor updated', schema: VendorUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateVendor(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a vendor',
    description: 'Cascades bank, documents, notes. Cleans up document images from storage. Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Vendor deleted', schema: VendorDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  deleteVendor(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteVendor(id, user);
  }

  // ─── BANK DETAILS ────────────────────────────────────────

  @Put(':id/bank')
  @ApiOperation({
    summary: 'Create or update vendor bank details',
    description: 'Upsert (creates if none, updates if exists). Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Bank details saved', schema: BankSavedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse })
  upsertBank(
    @Param('id') id: string,
    @Body() dto: UpsertVendorBankDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.upsertBank(id, dto, user);
  }

  @Delete(':id/bank')
  @ApiOperation({
    summary: 'Remove vendor bank details',
    description: 'Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Bank details removed', schema: BankRemovedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'No bank details found', schema: ErrorResponse })
  deleteBank(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteBank(id, user);
  }

  // ─── NOTES ────────────────────────────────────────────────

  @Post(':id/notes')
  @ApiOperation({
    summary: 'Add a note to a vendor',
    description: 'Captures caller as author. Requires full_access.',
  })
  @ApiResponse({ status: 201, description: 'Note added', schema: NoteCreatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse })
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateVendorNoteDto,
    @GetUser() user: { id: string; role: string; first_name?: string; last_name?: string },
  ) {
    return this.service.addNote(id, dto, user);
  }

  @Get(':id/notes')
  @ApiOperation({
    summary: 'List notes for a vendor',
    description: 'Requires at least view access.',
  })
  @ApiResponse({ status: 200, description: 'Notes list', schema: NoteListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse })
  listNotes(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listNotes(id, user);
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({
    summary: 'Delete a note',
    description: 'Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Note deleted', schema: NoteDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Note not found', schema: ErrorResponse })
  deleteNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteNote(id, noteId, user);
  }

  // ─── COMPLIANCE DOCUMENTS ─────────────────────────────────

  @Post(':id/documents')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Upload a compliance document with optional image.', schema: UploadDocumentBody })
  @ApiOperation({
    summary: 'Upload a compliance document',
    description: 'Multipart form-data. Auto-recomputes vendor compliance status. Requires full_access.',
  })
  @ApiResponse({ status: 201, description: 'Document uploaded', schema: DocumentUploadedResponse })
  @ApiResponse({ status: 400, description: 'Validation error / bad file type', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse })
  uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadVendorDocumentDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const image = files?.image?.[0];
    return this.service.uploadDocument(id, dto, image, user);
  }

  @Patch(':id/documents/:docId')
  @ApiOperation({
    summary: 'Update document status',
    description: 'Set to valid, expired, or pending. Auto-recomputes vendor compliance. Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Document status updated', schema: DocumentStatusUpdatedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse })
  updateDocumentStatus(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentStatusDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateDocumentStatus(id, docId, dto, user);
  }

  @Delete(':id/documents/:docId')
  @ApiOperation({
    summary: 'Delete a compliance document',
    description: 'Removes document and cleans up image from storage. Auto-recomputes compliance. Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Document deleted', schema: DocumentDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse })
  deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteDocument(id, docId, user);
  }

  // ─── COMPLIANCE OVERRIDE ──────────────────────────────────

  @Patch(':id/compliance')
  @ApiOperation({
    summary: 'Manually override compliance status',
    description: 'Sets complianceOverride=true so auto-recompute is skipped. Requires full_access.',
  })
  @ApiResponse({ status: 200, description: 'Compliance status updated', schema: ComplianceUpdatedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Vendor not found', schema: ErrorResponse })
  updateCompliance(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateCompliance(id, dto, user);
  }
}
