import {
  BadRequestException,
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
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorRfqsService } from './avendor-rfqs.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { ListRfqsQueryDto } from './dto/list-rfqs-query.dto';
import { CreateRfqItemDto } from './dto/create-rfq.dto';
import { UpdateRfqItemDto } from './dto/update-rfq-item.dto';
import { AssignRfqVendorsDto } from './dto/assign-rfq-vendors.dto';
import {
  ErrorResponse,
  MaterialCatalogResponse,
  RfqCreatedResponse,
  RfqListResponse,
  RfqDetailResponse,
  RfqUpdatedResponse,
  RfqDeletedResponse,
  ItemAddedResponse,
  ItemUpdatedResponse,
  ItemDeletedResponse,
  AttachmentsUploadedResponse,
  AttachmentDeletedResponse,
  VendorsAssignedResponse,
  VendorRemovedResponse,
  RfqSentResponse,
  UploadAttachmentsBody,
} from './avendor-rfqs.swagger';

@ApiTags('A-Vendor — RFQs')
@ApiBearerAuth()
@Controller('avendor/rfqs')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class AvendorRfqsController {
  constructor(private readonly service: AvendorRfqsService) {}

  // ─── CORE RFQ CRUD ────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create an RFQ',
    description:
      'Creates an RFQ with items and optionally assigns vendors. Body is JSON (no files). Each item requires a `materialId` from inventory — use `GET .../material-catalog` or `.../material-catalogue` for category/material dropdown data. Requires full_access on rfqs.',
  })
  @ApiResponse({ status: 201, description: 'RFQ created', schema: RfqCreatedResponse })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  createRfq(
    @Body() dto: CreateRfqDto,
    @GetUser() user: { id: string; role: string; first_name?: string; last_name?: string },
  ) {
    return this.service.createRfq(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List RFQs',
    description:
      'Paginated list with analysis cards (total, draft, sent, awarded). Requires at least view access.',
  })
  @ApiResponse({ status: 200, description: 'Paginated RFQ list', schema: RfqListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  listRfqs(
    @Query() query: ListRfqsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listRfqs(query, user);
  }

  @Get(['material-catalog', 'material-catalogue'])
  @ApiOperation({
    summary: 'Material catalog for RFQ dropdowns',
    description:
      'Returns all inventory categories with their materials (id, name, unit, price, stock, image) so the client can build category → material selectors when creating RFQ line items. Alias: `material-catalogue` (same handler). Requires at least view access on rfqs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories with nested materials',
    schema: MaterialCatalogResponse,
  })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  getMaterialCatalog(@GetUser() user: { id: string; role: string }) {
    return this.service.getMaterialCatalog(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full RFQ detail',
    description:
      'Includes items (with attachments and material reference), assigned vendors, and RFQ-level attachments.',
  })
  @ApiResponse({ status: 200, description: 'RFQ detail', schema: RfqDetailResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  getRfq(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.getRfq(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an RFQ',
    description:
      'Update title, dueDate, or description. Only draft or sent RFQs can be modified.',
  })
  @ApiResponse({ status: 200, description: 'RFQ updated', schema: RfqUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation / status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  updateRfq(
    @Param('id') id: string,
    @Body() dto: UpdateRfqDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateRfq(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an RFQ',
    description:
      'Cascades items, vendors, attachments. Cleans up all images from storage.',
  })
  @ApiResponse({ status: 200, description: 'RFQ deleted', schema: RfqDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  deleteRfq(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteRfq(id, user);
  }

  // ─── ITEMS ────────────────────────────────────────────────

  @Post(':id/items')
  @ApiOperation({
    summary: 'Add an item to an RFQ',
    description: 'Only draft or sent RFQs. Recalculates totalBudget.',
  })
  @ApiResponse({ status: 201, description: 'Item added', schema: ItemAddedResponse })
  @ApiResponse({ status: 400, description: 'Validation / status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ not found', schema: ErrorResponse })
  addItem(
    @Param('id') id: string,
    @Body() dto: CreateRfqItemDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.addItem(id, dto, user);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({
    summary: 'Update an RFQ item',
    description: 'Only draft or sent RFQs. Recalculates totalBudget.',
  })
  @ApiResponse({ status: 200, description: 'Item updated', schema: ItemUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Validation / status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ or item not found', schema: ErrorResponse })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateRfqItemDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateItem(id, itemId, dto, user);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({
    summary: 'Remove an item from an RFQ',
    description: 'Cascades item attachments and cleans up from storage. Recalculates totalBudget.',
  })
  @ApiResponse({ status: 200, description: 'Item deleted', schema: ItemDeletedResponse })
  @ApiResponse({ status: 400, description: 'Status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ or item not found', schema: ErrorResponse })
  deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteItem(id, itemId, user);
  }

  // ─── ITEM ATTACHMENTS ─────────────────────────────────────

  @Post(':id/items/:itemId/attachments')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Upload up to 10 images for an RFQ item.', schema: UploadAttachmentsBody })
  @ApiOperation({
    summary: 'Upload item attachments',
    description: 'Multipart form-data. Up to 10 images (JPEG, PNG, WebP, PDF).',
  })
  @ApiResponse({ status: 201, description: 'Attachments uploaded', schema: AttachmentsUploadedResponse })
  @ApiResponse({ status: 400, description: 'Bad file type / validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ or item not found', schema: ErrorResponse })
  uploadItemAttachments(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const images = files?.images ?? [];
    if (!images.length) {
      throw new BadRequestException('At least one image file is required.');
    }
    return this.service.uploadItemAttachments(id, itemId, images, user);
  }

  @Delete(':id/items/:itemId/attachments/:attachmentId')
  @ApiOperation({
    summary: 'Delete an item attachment',
    description: 'Removes attachment record and cleans up image from storage.',
  })
  @ApiResponse({ status: 200, description: 'Attachment deleted', schema: AttachmentDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Attachment not found', schema: ErrorResponse })
  deleteItemAttachment(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('attachmentId') attachmentId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteItemAttachment(id, itemId, attachmentId, user);
  }

  // ─── RFQ ATTACHMENTS ──────────────────────────────────────

  @Post(':id/attachments')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Upload up to 10 images for the RFQ.', schema: UploadAttachmentsBody })
  @ApiOperation({
    summary: 'Upload RFQ attachments',
    description: 'Multipart form-data. Up to 10 images (JPEG, PNG, WebP, PDF).',
  })
  @ApiResponse({ status: 201, description: 'Attachments uploaded', schema: AttachmentsUploadedResponse })
  @ApiResponse({ status: 400, description: 'Bad file type / validation error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ not found', schema: ErrorResponse })
  uploadRfqAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const images = files?.images ?? [];
    if (!images.length) {
      throw new BadRequestException('At least one image file is required.');
    }
    return this.service.uploadRfqAttachments(id, images, user);
  }

  @Delete(':id/attachments/:attachmentId')
  @ApiOperation({
    summary: 'Delete an RFQ attachment',
    description: 'Removes attachment record and cleans up image from storage.',
  })
  @ApiResponse({ status: 200, description: 'Attachment deleted', schema: AttachmentDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Attachment not found', schema: ErrorResponse })
  deleteRfqAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteRfqAttachment(id, attachmentId, user);
  }

  // ─── VENDOR ASSIGNMENT ────────────────────────────────────

  @Put(':id/vendors')
  @ApiOperation({
    summary: 'Assign vendors to an RFQ',
    description:
      'Replaces the current vendor list. Pass vendorIds or set sendToAllVendors=true. Only draft or sent RFQs.',
  })
  @ApiResponse({ status: 200, description: 'Vendors assigned', schema: VendorsAssignedResponse })
  @ApiResponse({ status: 400, description: 'No vendors / status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ not found', schema: ErrorResponse })
  assignVendors(
    @Param('id') id: string,
    @Body() dto: AssignRfqVendorsDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.assignVendors(id, dto, user);
  }

  @Delete(':id/vendors/:vendorId')
  @ApiOperation({
    summary: 'Remove a vendor from an RFQ',
    description: 'Removes a single vendor assignment.',
  })
  @ApiResponse({ status: 200, description: 'Vendor removed', schema: VendorRemovedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Assignment not found', schema: ErrorResponse })
  removeVendor(
    @Param('id') id: string,
    @Param('vendorId') vendorId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.removeVendor(id, vendorId, user);
  }

  // ─── SEND ─────────────────────────────────────────────────

  @Patch(':id/send')
  @ApiOperation({
    summary: 'Send an RFQ to vendors',
    description:
      'Validates RFQ has items and vendors, then sets status=sent. Only draft RFQs can be sent.',
  })
  @ApiResponse({ status: 200, description: 'RFQ sent', schema: RfqSentResponse })
  @ApiResponse({ status: 400, description: 'Validation / status error', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'RFQ not found', schema: ErrorResponse })
  sendRfq(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.sendRfq(id, user);
  }
}
