import { Controller, Get, Param, Query, Put, UseGuards, Body, Post, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtGuard } from '../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GenerateAffiliateLinkDto } from './dto/generate-affiliate-link.dto';
import { TrackAffiliateLinkConversionDto } from './dto/track-affiliate-link-conversion.dto';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';

@Controller('admin/affiliates')
@UseGuards(JwtGuard)
@Roles("admin")
export class ReferralsController {
    constructor(private referralsService: ReferralsService) {}

    @Get()
    async fetchAffiliateDashboard() {
        return this.referralsService.fetchAffiliateDashboard()
    }

    @Get('all')
    async fetchAllAffiliates(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string
    ) {
        return this.referralsService.fetchAllAffiliates(Number(page), Number(limit), status);
    }

    @Put(':id/status')
    async updateAffiliateStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.referralsService.updateAffiliateStatus(id, status);
    }

    // Generate affiliate link
    @Post('link')
    async generateAffiliateLink(
        @Request() req,
        @Body() dto: GenerateAffiliateLinkDto
    ) {
        const userId = req.user.id;
        return this.referralsService.generateAffiliateLink(userId, dto.productId);
    }

    // Get all affiliate links for a user
    @Get(':userId/links')
    async getAffiliateLinksForUser(
        @Param('userId') userId: string
    ) {
        return this.referralsService.getAffiliateLinksForUser(userId);
    }

    // Track click on affiliate link
    @Post('link/:slug/click')
    async trackAffiliateLinkClick(
        @Param('slug') slug: string
    ) {
        return this.referralsService.trackAffiliateLinkClick(slug);
    }

    // Track conversion for affiliate link
    @Post('link/:slug/conversion') 
    async trackAffiliateLinkConversion(
        @Param('slug') slug: string,
        @Body() dto: TrackAffiliateLinkConversionDto
    ) {
        return this.referralsService.trackAffiliateLinkConversion(slug, dto.orderId, dto.commissionAmount);
    }

    // Get affiliate link for current user and product
    @Get('link/:productId')
    async getAffiliateLinkForUserAndProduct(
        @Request() req,
        @Param('productId') productId: string
    ) {
        const userId = req.user.id;
        return this.referralsService.getAffiliateLinkForUserAndProduct(userId, productId);
    }

    @Get('commission-payouts')
    async fetchAllCommissionPayouts() {
        return this.referralsService.fetchAllCommissionPayouts();
    }

    // Update withdrawal request status (approve/reject)
    @Put('withdrawal/:payoutId/status')
    async updateWithdrawalStatus(
        @Param('payoutId') payoutId: string,
        @Request() req,
        @Body() dto: UpdateWithdrawalStatusDto
    ) {
        const adminId = req.user.id;
        return this.referralsService.updateWithdrawalStatus(
            payoutId, 
            dto.payoutStatus, 
            adminId, 
            dto.notes
        );
    }

    // Fetch all withdrawal requests with filtering and pagination
    @Get('withdrawals')
    async fetchAllWithdrawalRequests(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string
    ) {
        return this.referralsService.fetchAllWithdrawalRequests(
            Number(page), 
            Number(limit), 
            status
        );
    }

    // i said add the controller too

} 