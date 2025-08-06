import { Controller, Post } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller('admin/cron')
export class CronController {
    constructor(private readonly cronService: CronService) {}

    @Post('trigger-commission-approval')
    async triggerCommissionApproval() {
        await this.cronService.triggerCommissionApproval();
        return { message: 'Commission approval job triggered successfully' };
    }
} 