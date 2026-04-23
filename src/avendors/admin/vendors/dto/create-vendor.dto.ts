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
import { USERNAME_REGEX } from 'src/shared/utils/username.util';

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
      'Optional unique login handle (3–30 chars: lowercase letters, numbers, underscore).',
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
}

export class CreateVendorDto {
  @ApiProperty({ example: 'Global Supplies Ltd' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    type: CreateVendorPortalUserDto,
    description: 'Contact / portal user name fields (same as User `first_name` / `last_name`).',
  })
  @ValidateNested()
  @Type(() => CreateVendorPortalUserDto)
  user: CreateVendorPortalUserDto;

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
