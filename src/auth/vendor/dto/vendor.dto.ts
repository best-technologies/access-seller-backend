import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ALLOWED_PLATFORM_API_VALUES,
  type AllowedPlatformApiValue,
} from 'src/shared/constants/admin-platform-access.constants';
import { USERNAME_REGEX } from 'src/shared/utils/username.util';

export class OnboardVendorAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Unique handle (lowercase, 3–30 chars: letters, numbers, underscore).',
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone_number?: string;

  /**
   * Which platforms this admin may use. Defaults to ['avendor'] when omitted.
   * For multipart/form-data send a JSON string, e.g. `["avendor"]`.
   */
  @ApiPropertyOptional({
    isArray: true,
    enum: ALLOWED_PLATFORM_API_VALUES,
    example: ['avendor'],
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALLOWED_PLATFORM_API_VALUES, { each: true })
  allowed_platforms?: AllowedPlatformApiValue[];
}
