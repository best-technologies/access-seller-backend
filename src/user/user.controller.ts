import { Body, Controller, Get, Param, Post, Query, Request, UseGuards, Delete, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { requestAffiliatePermissionDto, affiliateMembershipRequestDto } from './dto/afiliate.dto';
import { RequestCommissionPayoutDto } from './dto/commission-payout.dto';
import { GenerateAffiliateLinkDto } from 'src/admin/referrals/dto/generate-affiliate-link.dto';
import { AddBankDto, DeleteBankDto, UpdateBankStatusDto } from './dto/bank.dto';
import { RequestWithdrawalNewDto } from './dto/withdrawal-request.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

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

  @Post('affiliate-membership-request')
  @UseInterceptors(
    FileInterceptor('ninImage'),
    FileValidationInterceptor
  )
  async affiliateMembershipRequest(
    @Body() dto: affiliateMembershipRequestDto, 
    @UploadedFile() ninImage: Express.Multer.File,
    @Request() req
  ) {
    return this.userService.affiliateMembershipRequest(dto, ninImage, req.user);
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

  @Post('bank')
  async addBank(@Request() req, @Body() dto: AddBankDto) {
    return this.userService.addBank(req.user, dto);
  }

  @Delete('bank')
  async deleteBank(@Request() req, @Body() dto: DeleteBankDto) {
    return this.userService.deleteBank(req.user, dto);
  }

  @Patch('bank/status')
  async updateBankStatus(@Request() req, @Body() dto: UpdateBankStatusDto) {
    return this.userService.updateBankStatus(req.user, dto);
  }

  // @Post('withdrawal-request')
  // async requestWithdrawal(@Request() req, @Body() dto: RequestWithdrawalDto) {
  //   return this.userService.requestWithdrawal(req.user, dto);
  // }

  @Post('withdrawal-request')
  async requestWithdrawal(@Request() req, @Body() dto: RequestWithdrawalNewDto) {
    return this.userService.requestWithdrawal(req.user, dto);
  }

  @Get('withdrawal-history')
  async getWithdrawalHistory(@Request() req) {
    return this.userService.getWithdrawalRequests(req.user);
  }
}
