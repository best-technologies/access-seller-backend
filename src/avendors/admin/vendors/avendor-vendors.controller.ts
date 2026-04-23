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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
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
  ApiDocAddNote,
  ApiDocCreateVendor,
  ApiDocDeleteBank,
  ApiDocDeleteDocument,
  ApiDocDeleteNote,
  ApiDocDeleteVendor,
  ApiDocGetVendor,
  ApiDocListNotes,
  ApiDocListVendors,
  ApiDocUpdateCompliance,
  ApiDocUpdateDocumentStatus,
  ApiDocUpdateVendor,
  ApiDocUploadDocument,
  ApiDocUpsertBank,
} from './doc';

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
  @ApiDocCreateVendor()
  createVendor(
    @Body() dto: CreateVendorDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.createVendor(dto, user);
  }

  @Get()
  @ApiDocListVendors()
  listVendors(
    @Query() query: ListVendorsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listVendors(query, user);
  }

  @Get(':id')
  @ApiDocGetVendor()
  getVendor(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.getVendor(id, user);
  }

  @Patch(':id')
  @ApiDocUpdateVendor()
  updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateVendor(id, dto, user);
  }

  @Delete(':id')
  @ApiDocDeleteVendor()
  deleteVendor(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteVendor(id, user);
  }

  // ─── BANK DETAILS ────────────────────────────────────────

  @Put(':id/bank')
  @ApiDocUpsertBank()
  upsertBank(
    @Param('id') id: string,
    @Body() dto: UpsertVendorBankDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.upsertBank(id, dto, user);
  }

  @Delete(':id/bank')
  @ApiDocDeleteBank()
  deleteBank(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteBank(id, user);
  }

  // ─── NOTES ────────────────────────────────────────────────

  @Post(':id/notes')
  @ApiDocAddNote()
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateVendorNoteDto,
    @GetUser() user: { id: string; role: string; first_name?: string; last_name?: string },
  ) {
    return this.service.addNote(id, dto, user);
  }

  @Get(':id/notes')
  @ApiDocListNotes()
  listNotes(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listNotes(id, user);
  }

  @Delete(':id/notes/:noteId')
  @ApiDocDeleteNote()
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
  @ApiDocUploadDocument()
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
  @ApiDocUpdateDocumentStatus()
  updateDocumentStatus(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentStatusDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateDocumentStatus(id, docId, dto, user);
  }

  @Delete(':id/documents/:docId')
  @ApiDocDeleteDocument()
  deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.deleteDocument(id, docId, user);
  }

  // ─── COMPLIANCE OVERRIDE ──────────────────────────────────

  @Patch(':id/compliance')
  @ApiDocUpdateCompliance()
  updateCompliance(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.updateCompliance(id, dto, user);
  }
}
