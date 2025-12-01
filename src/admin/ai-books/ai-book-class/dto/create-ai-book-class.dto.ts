import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAiBookClassDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}



