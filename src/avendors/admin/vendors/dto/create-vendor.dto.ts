import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { AvendorVendorStatus } from '@prisma/client';
import {
  USERNAME_REGEX,
  USERNAME_VALIDATION_MESSAGE,
} from 'src/shared/utils/username.util';

/** Portal login user — same name fields as `User`. */
export class CreateVendorPortalUserDto {
  @ApiProperty({ example: 'Chioma' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Adeyemi' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({
    description:
      'Optional unique login handle (3–30 chars: lowercase letters, numbers, underscore, hyphen). If omitted, the server assigns a unique handle in the form avd-YYYY-NNN (e.g. avd-2026-013).',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : String(value).trim().toLowerCase(),
  )
  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: USERNAME_VALIDATION_MESSAGE,
  })
  username?: string;
}

export class CreateVendorDto {
  @ApiProperty({ example: 'Global Supplies Ltd' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    type: CreateVendorPortalUserDto,
    description:
      'Contact / portal user (same as `User` first/last). Preferred. Alternatively send top-level `first_name` and `last_name` (some clients use flat JSON).',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVendorPortalUserDto)
  user?: CreateVendorPortalUserDto;

  @ApiPropertyOptional({
    example: 'Chioma',
    description:
      'Portal contact first name. Required if `user` is omitted; ignored for names when `user` is present.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Adeyemi',
    description:
      'Portal contact last name. Required if `user` is omitted; ignored for names when `user` is present.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({
    description:
      'Optional login handle; same as `user.username` when using nested `user`.',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : String(value).trim().toLowerCase(),
  )
  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: USERNAME_VALIDATION_MESSAGE,
  })
  username?: string;

  @ApiProperty({ example: 'contact@globalsupplies.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+2348161252897' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Industrial Equipment' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @ApiPropertyOptional({ example: '12 Adeola Odeku Street' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Nigeria', default: 'Nigeria' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ enum: AvendorVendorStatus, default: 'active' })
  @IsOptional()
  @IsEnum(AvendorVendorStatus)
  status?: AvendorVendorStatus;
}
