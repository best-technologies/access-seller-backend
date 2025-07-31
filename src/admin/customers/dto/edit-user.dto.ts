import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { UserRole, UserStatus, UserLevel, Gender } from '@prisma/client';

export class EditUserDTO {

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEnum(UserLevel)
    level?: UserLevel;

    @IsOptional()
    @IsNumber()
    allowedPartialPayment?: number;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    permissions?: string[];

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    display_picture?: string;
} 