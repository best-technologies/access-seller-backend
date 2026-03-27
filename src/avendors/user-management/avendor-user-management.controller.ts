import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AvendorUserManagementService } from './avendor-user-management.service';
import { ListAvendorUsersQueryDto } from './dto/list-avendor-users-query.dto';
import { UpdateAvendorUserByAdminDto } from './dto/update-avendor-user-by-admin.dto';

@ApiTags('A-Vendor — User management')
@ApiBearerAuth()
@Controller('avendor/user-management')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class AvendorUserManagementController {
  constructor(private readonly service: AvendorUserManagementService) {}

  @Get('users')
  @ApiOperation({
    summary: 'List users on A-Vendor',
    description:
      'Users who have `avendor` on `allowedPlatformsForUser` and/or `allowedPlatformsForAdmin`. Optional filters: `is_a_vendor` (boolean), `role` (UserRole). Each item includes `is_a_vendor`. Requires super_admin or non–no-access on A-Vendor vendors_management.',
  })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listUsers(
    @Query() query: ListAvendorUsersQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listUsers(query, user);
  }

  @Get('users/avendor-admins')
  @ApiOperation({
    summary: 'List A-Vendor staff admins',
    description:
      '`role` = admin, `is_a_vendor` = false, and `avendor` in `allowedPlatformsForAdmin`. Same pagination/search as list users. Requires super_admin or vendors_management view (non–no-access).',
  })
  @ApiResponse({ status: 200, description: 'Paginated admin list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listAvendorAdmins(
    @Query() query: ListAvendorUsersQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.listAvendorAdmins(query, user);
  }

  @Patch('users/:userId')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'display_picture', maxCount: 1 }]),
    FileValidationInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Send only fields to change. Platform lists as JSON strings when using multipart, e.g. `["avendor"]`.',
    schema: {
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone_number: { type: 'string' },
        username: { type: 'string' },
        role: {
          type: 'string',
          enum: [
            'super_admin',
            'admin',
            'inventory_manager',
            'shipment_manager',
            'marketer',
            'user',
          ],
        },
        status: { type: 'string', enum: ['active', 'suspended', 'inactive'] },
        allowed_platforms: {
          type: 'string',
          example: '["avendor","access-seller"]',
          description: 'Admin console platforms (JSON array string)',
        },
        allowed_platforms_for_user: {
          type: 'string',
          example: '["avendor"]',
          description: 'User segmentation platforms (JSON array string)',
        },
        display_picture: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Update an A-Vendor user (admin)',
    description:
      'Requires super_admin or **full** access on A-Vendor `vendors_management`. Replaces display picture in storage when a new file is sent (previous asset deleted when possible).',
  })
  @ApiResponse({ status: 200, description: 'Updated user payload' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email conflict' })
  updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateAvendorUserByAdminDto,
    @UploadedFiles()
    files: { display_picture?: Express.Multer.File[] },
    @GetUser() user: { id: string; role: string },
  ) {
    const displayPicture = files?.display_picture?.[0];
    return this.service.updateUserByAdmin(userId, dto, displayPicture, user);
  }
}
