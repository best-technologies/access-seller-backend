import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateWithdrawalStatusDto {
    @IsString()
    @IsIn(['not_requested', 'pending', 'paid', 'cancelled'])
    payoutStatus: string;

    @IsOptional()
    @IsString()
    notes?: string;
} 