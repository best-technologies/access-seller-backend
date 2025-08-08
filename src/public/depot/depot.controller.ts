import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DepotService } from '../../admin/metadata/depot/depot.service';
import { DepotResponseDto } from '../../admin/metadata/depot/dto/depot-response.dto';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';

@ApiTags('Public - Depots')
@Controller('public/depots')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class PublicDepotController {
  constructor(private readonly depotService: DepotService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all active depots',
    description: 'Retrieves all active depots available for pickup'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Depots retrieved successfully',
    type: [DepotResponseDto] 
  })
  async findAll() {
    try {
      const result = await this.depotService.findAll();
      return ResponseHelper.success('Depots retrieved successfully', result.data);
    } catch (error) {
      return ResponseHelper.error(
        error.message || 'Failed to retrieve depots',
        null,
        error.status || 500
      );
    }
  }
}
