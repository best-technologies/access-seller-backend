import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { AvendorPermissionsService } from './avendor-permissions.service';
import { CreateAvendorPermissionDto } from './dto/create-avendor-permission.dto';
import { ListAvendorPermissionsQueryDto } from './dto/list-avendor-permissions-query.dto';
import { UpdateAvendorPermissionDto } from './dto/update-avendor-permission.dto';
import {
  ErrorResponse,
  ModuleCatalogResponse,
  PermissionCreatedResponse,
  PermissionDeletedResponse,
  PermissionDetailResponse,
  PermissionListResponse,
  PermissionUpdatedResponse,
} from './avendor-permissions.swagger';

@ApiTags('A-Vendor — Permissions')
@ApiBearerAuth()
@Controller('avendor/permissions')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AvendorPermissionsController {
  constructor(private readonly service: AvendorPermissionsService) {}

  @Get('module-catalog')
  @ApiOperation({ summary: 'Module keys, labels, and allowed access levels (for UI)' })
  @ApiResponse({ status: 200, description: 'Module catalog', schema: ModuleCatalogResponse })
  moduleCatalog() {
    return this.service.moduleCatalog();
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user\'s A-Vendor permission matrix' })
  @ApiResponse({ status: 200, description: 'Permission matrix', schema: PermissionDetailResponse })
  @ApiResponse({ status: 404, description: 'No permission record', schema: ErrorResponse })
  me(@GetUser() user: { id: string; email: string }) {
    return this.service.findMine(user.id, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List permission rows (requires onboarding full access or super_admin)' })
  @ApiResponse({ status: 200, description: 'Paginated permission list', schema: PermissionListResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  list(
    @Query() query: ListAvendorPermissionsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.list(query, user);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get one user\'s matrix (self, super_admin, or onboarding manager)' })
  @ApiResponse({ status: 200, description: 'Permission matrix', schema: PermissionDetailResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  findOne(
    @Param('userId') userId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.findOne(userId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create permission row for a user (onboarding full or super_admin)' })
  @ApiResponse({ status: 201, description: 'Permission created', schema: PermissionCreatedResponse })
  @ApiResponse({ status: 400, description: 'Already exists / bad request', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'User not found', schema: ErrorResponse })
  create(
    @Body() dto: CreateAvendorPermissionDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update permission levels (onboarding full or super_admin)' })
  @ApiResponse({ status: 200, description: 'Permission updated', schema: PermissionUpdatedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateAvendorPermissionDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.update(userId, dto, user);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete permission row (onboarding full or super_admin)' })
  @ApiResponse({ status: 200, description: 'Permission deleted', schema: PermissionDeletedResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', schema: ErrorResponse })
  @ApiResponse({ status: 404, description: 'Not found', schema: ErrorResponse })
  remove(
    @Param('userId') userId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.remove(userId, user);
  }
}
