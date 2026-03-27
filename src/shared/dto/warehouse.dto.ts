import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { USERNAME_REGEX } from 'src/shared/utils/username.util';

export class OnboardWarehouseAdminDTO {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

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

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;
}
