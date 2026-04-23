import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { ChangeVendorPasswordDto } from '../dto/change-password.dto';
import * as argon from 'argon2';
import * as colors from 'colors';

@Injectable()
export class VendorProfileSecurityService {
  private readonly logger = new Logger(VendorProfileSecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async changePassword(userId: string, dto: ChangeVendorPasswordDto) {
    this.logger.log(colors.blue(`Vendor password change requested user=${userId}`));

    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new BadRequestException(
        'This account has no password set (e.g. SSO login); contact admin to initialize one',
      );
    }

    const ok = await argon.verify(user.password, dto.currentPassword);
    if (!ok) {
      this.logger.warn(colors.yellow(`Current password mismatch for user=${userId}`));
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await argon.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    this.logger.log(colors.green(`Password changed for user=${userId}`));
    return ResponseHelper.success('Password changed', { id: userId });
  }
}
