import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';
import { UserRole } from '@prisma/client';
import { CommissionReferralConfigService } from './commission.referral.service';
import { CreateCommissionReferralConfigDto } from './dto/create-commission-referral-config.dto';
import { UpdateCommissionReferralConfigDto } from './dto/update-commission-referral-config.dto';

@ApiTags('Admin - Config - Referral Commission')
@ApiBearerAuth()
@Controller('admin/config')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class ConfigController {
  constructor(
    private readonly commissionReferralConfigService: CommissionReferralConfigService,
  ) {}

  @Post('referral-commission')
  @ApiOperation({
    summary: 'Create referral commission band',
    description:
      'Create a new referral/affiliate commission configuration band for a purchase amount range.',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission referral config created successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error (overlapping range, invalid min/max, or non‑monotonic percentage).',
  })
  createReferralCommissionConfig(
    @Body() dto: CreateCommissionReferralConfigDto,
    @GetUser() adminUser: any,
  ) {
    return this.commissionReferralConfigService.create(dto, adminUser);
  }

  @Get('referral-commission')
  @ApiOperation({
    summary: 'List referral commission bands',
    description: 'Fetch all referral/affiliate commission configuration bands ordered by minAmount.',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission referral configs fetched successfully.',
  })
  getAllReferralCommissionConfigs() {
    return this.commissionReferralConfigService.findAll();
  }

  @Get('referral-commission/:id')
  @ApiOperation({
    summary: 'Get referral commission band',
    description: 'Fetch a single referral/affiliate commission configuration band by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'CommissionReferralConfig ID',
    example: 'clz1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission referral config fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Commission referral config not found.',
  })
  getReferralCommissionConfig(@Param('id') id: string) {
    return this.commissionReferralConfigService.findOne(id);
  }

  @Patch('referral-commission/:id')
  @ApiOperation({
    summary: 'Update referral commission band',
    description:
      'Update an existing referral/affiliate commission configuration band. All validations (overlap and non‑decreasing percentage) still apply.',
  })
  @ApiParam({
    name: 'id',
    description: 'CommissionReferralConfig ID',
    example: 'clz1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission referral config updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error (overlapping range, invalid min/max, or non‑monotonic percentage).',
  })
  @ApiResponse({
    status: 404,
    description: 'Commission referral config not found.',
  })
  updateReferralCommissionConfig(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionReferralConfigDto,
  ) {
    return this.commissionReferralConfigService.update(id, dto);
  }

  @Delete('referral-commission/:id')
  @ApiOperation({
    summary: 'Delete referral commission band',
    description: 'Delete a referral/affiliate commission configuration band by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'CommissionReferralConfig ID',
    example: 'clz1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission referral config deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Commission referral config not found.',
  })
  deleteReferralCommissionConfig(@Param('id') id: string) {
    return this.commissionReferralConfigService.remove(id);
  }
}

