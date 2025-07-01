import { IsNotEmpty, IsString } from "class-validator";

export class VerifyAccountNumberDto {
    @IsString()
    @IsNotEmpty()
    account_number: string;
    
    @IsString()
    @IsNotEmpty()
    bank_code: string;
}