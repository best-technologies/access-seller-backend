import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Mirrors the Figma "Change password" modal validation:
 * min 8 chars, one lowercase, one uppercase, one special char from a small set.
 */
export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

export class ChangeVendorPasswordDto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  currentPassword: string;

  @ApiProperty({
    example: 'NewPass123!',
    description:
      'Minimum 8 chars with at least one lowercase, one uppercase, and one special character.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  @Matches(PASSWORD_POLICY_REGEX, {
    message:
      'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, and a special character.',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  confirmNewPassword: string;
}
