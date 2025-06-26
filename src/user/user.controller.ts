import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';
import { RequestCommissionPayoutDto } from './dto/commission-payout.dto';
import { GenerateAffiliateLinkDto } from 'src/admin/referrals/dto/generate-affiliate-link.dto';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user-checkout-profile')
  async getUserAllowedPartialpayment(@Request() req) {
    return this.userService.getUserAllowedPartialpayment(req.user);
  }

  @Post('request-affiliate-access')
  async requestToBecomeAnAffiliate(@Body() dto: requestAffiliatePermissionDto, @Request() req) {
    return this.userService.requestToBecomeAnAffiliate(dto, req.user);
  }

  @Get('affiliate-dashboard')
  async fetchAffiliateDashboard(@Request() req) {
    return this.userService.fetchAffiliateDashboard(req.user);
  }

  // Generate affiliate link
  @Post('generate-link')
  async generateAffiliateLink(
      @Request() req,
      @Body() dto: GenerateAffiliateLinkDto
  ) {
      const userId = req.user.id;
      return this.userService.generateAffiliateLink(userId, dto.productId);
  }

  @Get('affiliate-links')
    async getAffiliateLinksForUser(
        @Request() req
    ) {
        return this.userService.getAffiliateLinksForUser(req.user);
    }

  // Commission payout endpoints
  @Post('commission-payout/request')
  async requestCommissionPayout(@Request() req, @Body() dto: RequestCommissionPayoutDto) {
    return this.userService.requestCommissionPayout(req.user, dto);
  }

  @Get('commission-payout/history')
  async getCommissionPayoutHistory(@Request() req) {
    return this.userService.getCommissionPayoutHistory(req.user);
  }
}
