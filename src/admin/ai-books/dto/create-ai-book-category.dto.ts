import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateAiBookCategoryDto {
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


