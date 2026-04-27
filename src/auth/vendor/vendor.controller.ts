import {
  Body,
  Controller,
  Post,
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
import { JwtGuard } from '../guard';
import { VendorService } from './vendor.service';
import { OnboardVendorAdminDto } from './dto/vendor.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

@ApiTags('Vendor (A-Vendor)')
@ApiBearerAuth()
@Controller('auth/vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('onboard-vendor-admin')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'display_picture', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Form fields for onboarding. Optional `display_picture` image (JPEG/PNG). `allowed_platforms` as JSON string when using multipart.',
    schema: {
      type: 'object',
      required: ['first_name', 'last_name', 'email'],
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone_number: { type: 'string' },
        company_position: {
          type: 'string',
          description: 'Optional job title / company position',
        },
        username: {
          type: 'string',
          description: 'Optional unique handle (3–30 chars: a-z, 0-9, _, -)',
        },
        allowed_platforms: {
          type: 'string',
          example: '["avendor"]',
          description: 'JSON array string',
        },
        display_picture: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Onboard a new A-Vendor admin' })
  @ApiResponse({ status: 201, description: 'Vendor admin onboarded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  onboardVendorAdmin(
    @Body() dto: OnboardVendorAdminDto,
    @UploadedFiles()
    files?: { display_picture?: Express.Multer.File[] },
  ) {
    const displayPicture = files?.display_picture?.[0];
    return this.vendorService.onboardVendorAdmin(dto, displayPicture);
  }
}
