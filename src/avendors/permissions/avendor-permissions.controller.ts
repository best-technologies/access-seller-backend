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
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorPermissionsService } from './avendor-permissions.service';
import { CreateAvendorPermissionDto } from './dto/create-avendor-permission.dto';
import { ListAvendorPermissionsQueryDto } from './dto/list-avendor-permissions-query.dto';
import { UpdateAvendorPermissionDto } from './dto/update-avendor-permission.dto';

@ApiTags('A-Vendor — Permissions')
@ApiBearerAuth()
@Controller('avendor/permissions')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AvendorPermissionsController {
  constructor(private readonly service: AvendorPermissionsService) {}

  @Get('module-catalog')
  @ApiOperation({ summary: 'Module keys, labels, and allowed access levels (for UI)' })
  moduleCatalog() {
    return this.service.moduleCatalog();
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user’s A-Vendor permission matrix' })
  me(@GetUser() user: { id: string; email: string }) {
    return this.service.findMine(user.id, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List permission rows (requires onboarding full access or super_admin)' })
  list(
    @Query() query: ListAvendorPermissionsQueryDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.list(query, user);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get one user’s matrix (self, super_admin, or onboarding manager)' })
  findOne(
    @Param('userId') userId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.findOne(userId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create permission row for a user (onboarding full or super_admin)' })
  create(
    @Body() dto: CreateAvendorPermissionDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update permission levels (onboarding full or super_admin)' })
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateAvendorPermissionDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.update(userId, dto, user);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete permission row (onboarding full or super_admin)' })
  remove(
    @Param('userId') userId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.service.remove(userId, user);
  }
}
