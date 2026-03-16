import { PartialType } from '@nestjs/mapped-types';
import { CreateCommissionReferralConfigDto } from './create-commission-referral-config.dto';

export class UpdateCommissionReferralConfigDto extends PartialType(
  CreateCommissionReferralConfigDto,
) {}

