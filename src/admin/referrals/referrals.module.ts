import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
    imports: [],
    controllers: [ReferralsController],
    providers: [ReferralsService],
    exports: [ReferralsService]
})
export class ReferralsModule {} 