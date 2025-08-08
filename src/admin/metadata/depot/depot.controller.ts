import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DepotService } from './depot.service';
import { CreateDepotDto } from './dto/create-depot.dto';
import { UpdateDepotDto } from './dto/update-depot.dto';
import { DepotResponseDto } from './dto/depot-response.dto';
import { JwtGuard } from '../../../auth/guard/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../auth/decorator/get-user-decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Metadata - Depot')
@Controller('admin/metadata/depot')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class DepotController {
  constructor(private readonly depotService: DepotService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ 
    summary: 'Create a new depot',
    description: 'Creates a new depot for the authenticated user\'s store'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Depot created successfully',
    type: DepotResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - User does not have an associated store' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  create(
    @Body() createDepotDto: CreateDepotDto,
    @GetUser() user: any
  ) {
    return this.depotService.create(createDepotDto, user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all depots',
    description: 'Retrieves all available depots'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Depots retrieved successfully',
    type: [DepotResponseDto] 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - User does not have an associated store' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  findAll() {
    return this.depotService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ 
    summary: 'Get a specific depot',
    description: 'Retrieves a specific depot by ID for the authenticated user\'s store'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Depot ID',
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Depot retrieved successfully',
    type: DepotResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - User does not have an associated store' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Depot not found' 
  })
  findOne(
    @Param('id') id: string,
    @GetUser() user: any
  ){
    return this.depotService.findOne(id, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ 
    summary: 'Update a depot',
    description: 'Updates a specific depot by ID for the authenticated user\'s store'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Depot ID',
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Depot updated successfully',
    type: DepotResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - User does not have an associated store' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Depot not found' 
  })
  update(
    @Param('id') id: string, 
    @Body() updateDepotDto: UpdateDepotDto,
    @GetUser() user: any
  ) {
    return this.depotService.update(id, updateDepotDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ 
    summary: 'Delete a depot',
    description: 'Deletes a specific depot by ID for the authenticated user\'s store'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Depot ID',
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Depot deleted successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - User does not have an associated store' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Depot not found' 
  })
  remove(
    @Param('id') id: string,
    @GetUser() user: any
  ) {
    return this.depotService.remove(id, user);
  }
}
