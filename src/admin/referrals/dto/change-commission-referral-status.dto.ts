import { CommissionReferralStatus, WithdrawalStatus } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class ChangeCommissionReferralStatusDto {
    @IsString()
    commissionReferralId: string;

    @IsEnum(CommissionReferralStatus)
    status: CommissionReferralStatus;
}

export class ChangeWithdrawalStatusDto {
    @IsString()
    withdrawalRequestId: string;

    @IsEnum(WithdrawalStatus)
    status: WithdrawalStatus;
}