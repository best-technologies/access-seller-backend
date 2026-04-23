import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { VendorPortalGuard } from '../guards/vendor-portal.guard';
import { GetVendorContext } from '../decorators/get-vendor-context.decorator';
import type { VendorPortalContext } from '../guards/vendor-portal.guard';
import { VendorProfileService } from './vendor-profile.service';
import { VendorProfileCompanyService } from './services/vendor-profile-company.service';
import { VendorProfileBankService } from './services/vendor-profile-bank.service';
import { VendorProfileComplianceService } from './services/vendor-profile-compliance.service';
import { VendorProfileSecurityService } from './services/vendor-profile-security.service';
import { UpdateVendorCompanyDto } from './dto/update-company.dto';
import { UpsertVendorPortalBankDto } from './dto/upsert-bank.dto';
import {
  UpdateComplianceDocumentDto,
  UploadComplianceDocumentDto,
} from './dto/upload-compliance-document.dto';
import { ChangeVendorPasswordDto } from './dto/change-password.dto';
import {
  ErrorResponse,
  UpdateComplianceBody,
  UploadComplianceBody,
  VendorBankRemovedResponse,
  VendorBankSavedResponse,
  VendorCompanyUpdatedResponse,
  VendorDocumentDeletedResponse,
  VendorDocumentSavedResponse,
  VendorPasswordChangedResponse,
  VendorProfileAggregateResponse,
} from './vendor-profile.swagger';

@ApiTags('Vendor Portal — Profile')
@ApiBearerAuth()
@Controller('vendor/profile')
@UseGuards(JwtGuard, VendorPortalGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class VendorProfileController {
  constructor(
    private readonly profile: VendorProfileService,
    private readonly company: VendorProfileCompanyService,
    private readonly bank: VendorProfileBankService,
    private readonly compliance: VendorProfileComplianceService,
    private readonly security: VendorProfileSecurityService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the authenticated vendor profile (aggregate)',
    description:
      'Returns the supplier company card, bank card, compliance documents with expiry dates, security flags, and the weighted profile-completion breakdown used by the dashboard banner. Password hash is never returned.',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved', schema: VendorProfileAggregateResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Supplier record or user not found', schema: ErrorResponse })
  async getProfile(@GetVendorContext() ctx: VendorPortalContext) {
    return this.profile.getProfile(ctx.userId, ctx.vendorId);
  }

  // ─── COMPANY ────────────────────────────────────────────

  @Patch('company')
  @ApiOperation({
    summary: 'Update company profile fields',
    description:
      'Partial update for supplier contact and address details: `name`, `industry`, `phone`, `address`, `city`, `country`. Email is NOT editable here — it is sourced from the login `User.email`.',
  })
  @ApiBody({ type: UpdateVendorCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated', schema: VendorCompanyUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error or no fields provided', schema: ErrorResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  async updateCompany(
    @GetVendorContext() ctx: VendorPortalContext,
    @Body() dto: UpdateVendorCompanyDto,
  ) {
    return this.company.updateCompany(ctx.vendorId, dto);
  }

  // ─── BANK ───────────────────────────────────────────────

  @Put('bank')
  @ApiOperation({
    summary: 'Create or replace bank details (upsert)',
    description:
      'Stores one bank row per supplier (1:1). Call again with new values to overwrite. Fields are required on every call because the row is overwritten in place.',
  })
  @ApiBody({ type: UpsertVendorPortalBankDto })
  @ApiResponse({ status: 200, description: 'Bank details saved', schema: VendorBankSavedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  async upsertBank(
    @GetVendorContext() ctx: VendorPortalContext,
    @Body() dto: UpsertVendorPortalBankDto,
  ) {
    return this.bank.upsertBank(ctx.vendorId, dto);
  }

  @Delete('bank')
  @ApiOperation({
    summary: 'Remove bank details on file',
    description: 'Deletes the single bank row for the supplier. No payload.',
  })
  @ApiResponse({ status: 200, description: 'Bank details removed', schema: VendorBankRemovedResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'No bank on file', schema: ErrorResponse })
  async deleteBank(@GetVendorContext() ctx: VendorPortalContext) {
    return this.bank.deleteBank(ctx.vendorId);
  }

  // ─── COMPLIANCE ─────────────────────────────────────────

  @Post('compliance/documents')
  @ApiOperation({
    summary: 'Upload a new compliance document',
    description:
      'Multipart upload. Accepts PDF, JPEG, or PNG files up to the global upload limit (see MAX_UPLOAD_FILE_BYTES). `expiresAt` is optional for documents without an expiry (e.g. CAC). Status starts as `pending`; admin review moves it to `valid` or `expired`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(UploadComplianceBody)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiResponse({ status: 201, description: 'Document uploaded', schema: VendorDocumentSavedResponse })
  @ApiResponse({ status: 400, description: 'Missing file, wrong MIME, or validation error', schema: ErrorResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  async uploadComplianceDoc(
    @GetVendorContext() ctx: VendorPortalContext,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
    @Body() dto: UploadComplianceDocumentDto,
  ) {
    const file = files?.image?.[0];
    return this.compliance.uploadDocument(ctx.vendorId, dto, file);
  }

  @Patch('compliance/documents/:docId')
  @ApiOperation({
    summary: 'Replace a compliance document file or its metadata',
    description:
      'Either swap the underlying file (re-upload flow; previous asset is purged from storage) or update metadata only. Providing a new file resets `status` to `pending`.',
  })
  @ApiParam({ name: 'docId', description: 'Compliance document id', example: 'clxyz1234567890' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(UpdateComplianceBody)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiResponse({ status: 200, description: 'Document updated', schema: VendorDocumentSavedResponse })
  @ApiResponse({ status: 400, description: 'No fields or file provided', schema: ErrorResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse })
  async updateComplianceDoc(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('docId') docId: string,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
    @Body() dto: UpdateComplianceDocumentDto,
  ) {
    const file = files?.image?.[0];
    return this.compliance.updateDocument(ctx.vendorId, docId, dto, file);
  }

  @Delete('compliance/documents/:docId')
  @ApiOperation({
    summary: 'Delete a compliance document',
    description: 'Removes the document row and its underlying file from storage.',
  })
  @ApiParam({ name: 'docId', description: 'Compliance document id', example: 'clxyz1234567890' })
  @ApiResponse({ status: 200, description: 'Document deleted', schema: VendorDocumentDeletedResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Document not found', schema: ErrorResponse })
  async deleteComplianceDoc(
    @GetVendorContext() ctx: VendorPortalContext,
    @Param('docId') docId: string,
  ) {
    return this.compliance.deleteDocument(ctx.vendorId, docId);
  }

  // ─── SECURITY ───────────────────────────────────────────

  @Post('security/change-password')
  @ApiOperation({
    summary: 'Change account password',
    description:
      'Requires the current password to verify, plus a matching confirmation. New password policy: min 8 chars, at least one lowercase, one uppercase, and one special character.',
  })
  @ApiBody({ type: ChangeVendorPasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed', schema: VendorPasswordChangedResponse })
  @ApiResponse({ status: 400, description: 'Password policy violation or mismatch with confirmation', schema: ErrorResponse })
  @ApiResponse({ status: 401, description: 'Current password incorrect', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Not a linked supplier', schema: ErrorResponse })
  async changePassword(
    @GetVendorContext() ctx: VendorPortalContext,
    @Body() dto: ChangeVendorPasswordDto,
  ) {
    return this.security.changePassword(ctx.userId, dto);
  }
}
