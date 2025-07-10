import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateWithdrawalStatusDto {

    @IsString()
    @IsNotEmpty()
    withdrawalId: string

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsOptional()
    @IsString()
    notes?: string;
} 