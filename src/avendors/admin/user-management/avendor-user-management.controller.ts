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
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorUserManagementService } from './avendor-user-management.service';
import { ListAvendorUsersQueryDto } from './dto/list-avendor-users-query.dto';
import { UpdateAvendorUserByAdminDto } from './dto/update-avendor-user-by-admin.dto';
import {
  ErrorResponse,
  UpdateUserBody,
  UserListResponse,
  UserUpdatedResponse,
} from './avendor-user-management.swagger';

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
      'Users who have `avendor` on `allowedPlatformsForUser` and/or `allowedPlatformsForAdmin`. Optional filters: `is_a_vendor` (boolean), `role` (UserRole). Requires super_admin or non\u2013no-access on A-Vendor vendors_management.',
  })
  @ApiResponse({ status: 200, description: 'Paginated user list', schema: UserListResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
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
      '`role` = admin, `is_a_vendor` = false, and `avendor` in `allowedPlatformsForAdmin`. Same pagination/search as list users. Requires super_admin or vendors_management view (non\u2013no-access).',
  })
  @ApiResponse({ status: 200, description: 'Paginated admin list', schema: UserListResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
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
    schema: UpdateUserBody,
  })
  @ApiOperation({
    summary: 'Update an A-Vendor user (admin)',
    description:
      'Requires super_admin or **full** access on A-Vendor `vendors_management`. Replaces display picture in storage when a new file is sent (previous asset deleted when possible).',
  })
  @ApiResponse({ status: 200, description: 'Updated user payload', schema: UserUpdatedResponse })
  @ApiResponse({ status: 400, description: 'Bad request', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'User not found', schema: ErrorResponse })
  @ApiResponse({ status: 409, description: 'Email conflict', schema: ErrorResponse })
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
