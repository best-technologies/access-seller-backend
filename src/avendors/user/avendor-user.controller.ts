import { Controller, Get, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { AvendorPlatformGuard } from '../guards/avendor-platform.guard';
import { AvendorUserService } from './avendor-user.service';
import { ErrorResponse, ProfileResponse } from './avendor-user.swagger';

@ApiTags('A-Vendor — User')
@ApiBearerAuth()
@Controller('avendor/user')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AvendorUserController {
  constructor(private readonly service: AvendorUserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Current user\'s A-Vendor profile',
    description:
      'Identity, platforms, global permission slugs, A-Vendor module matrix, and security flags. Password hashes are never returned.',
  })
  @ApiResponse({ status: 200, description: 'Profile payload', schema: ProfileResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: ErrorResponse })
  @ApiResponse({ status: 403, description: 'A-Vendor platform access required', schema: ErrorResponse })
  profile(@GetUser() user: { id: string; email: string }) {
    return this.service.getMyProfile(user);
  }
}
