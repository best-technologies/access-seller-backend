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
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { EditPermissionsDto } from './dto/edit-permissions.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';

@Controller('distribution/user-management')
@UseGuards(JwtGuard)
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  getDashboard() {
    return this.userManagementService.getDashboard();
  }

  @Get('all')
  findAll(@Query() query: ListUsersQueryDto) {
    return this.userManagementService.findAll(query);
  }

  @Get('permissions')
  getAllPermissions() {
    return this.userManagementService.getAllPermissions();
  }

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.userManagementService.createPermission(dto);
  }

  @Patch('permissions/:permissionId')
  updatePermission(
    @Param('permissionId') permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.userManagementService.updatePermission(permissionId, dto);
  }

  @Delete('permissions/:permissionId')
  deletePermission(@Param('permissionId') permissionId: string) {
    return this.userManagementService.deletePermission(permissionId);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: EditUserDto) {
    return this.userManagementService.updateUser(id, dto);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: EditPermissionsDto,
    @GetUser() user?: { id: string },
  ) {
    return this.userManagementService.updatePermissions(id, dto, user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userManagementService.findOne(id);
  }
}
