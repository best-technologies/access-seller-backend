import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAiBookSubjectDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}



