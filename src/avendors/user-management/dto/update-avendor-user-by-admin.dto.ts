import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import {
  ALLOWED_PLATFORM_API_VALUES,
  type AllowedPlatformApiValue,
} from 'src/shared/constants/admin-platform-access.constants';
import { USERNAME_REGEX } from 'src/shared/utils/username.util';

function parsePlatformsJson(value: unknown): AllowedPlatformApiValue[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value as AllowedPlatformApiValue[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export class UpdateAvendorUserByAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Lowercase, 3–30 chars: letters, digits, underscore.',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : String(value).trim().toLowerCase(),
  )
  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message:
      'Username must be 3–30 characters: lowercase letters, numbers, underscore only',
  })
  username?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    isArray: true,
    enum: ALLOWED_PLATFORM_API_VALUES,
    description: 'JSON array string when using multipart.',
  })
  @Transform(({ value }) => parsePlatformsJson(value))
  @IsOptional()
  @IsArray()
  @IsIn(ALLOWED_PLATFORM_API_VALUES, { each: true })
  allowed_platforms?: AllowedPlatformApiValue[];

  @ApiPropertyOptional({
    isArray: true,
    enum: ALLOWED_PLATFORM_API_VALUES,
    description: 'JSON array string when using multipart.',
  })
  @Transform(({ value }) => parsePlatformsJson(value))
  @IsOptional()
  @IsArray()
  @IsIn(ALLOWED_PLATFORM_API_VALUES, { each: true })
  allowed_platforms_for_user?: AllowedPlatformApiValue[];
}
