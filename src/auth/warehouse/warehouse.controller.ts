import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { OnboardWarehouseAdminDTO } from 'src/shared/dto/warehouse.dto';
import { JwtGuard } from '../guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Warehouse & Inventory')
@Controller('auth/warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post('onboard-warehouse-admin')
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Onboard a new warehouse admin' })
  @ApiResponse({ status: 201, description: 'Warehouse admin onboarded successfully' })
  @ApiResponse({ status: 400, description: 'User with this email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  onboardWarehouseAdmin(@Body() dto: OnboardWarehouseAdminDTO) {
    return this.warehouseService.onboardWarehouseAdmin(dto);
  }
}
