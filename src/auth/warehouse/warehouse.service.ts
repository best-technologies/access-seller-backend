import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as argon from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { OnboardWarehouseAdminDTO } from 'src/shared/dto/warehouse.dto';
import {
  ensureUsernameAvailable,
  normalizeUsernameInput,
  USERNAME_REGEX,
} from 'src/shared/utils/username.util';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onboardWarehouseAdmin(dto: OnboardWarehouseAdminDTO) {
    this.logger.log('Onboarding new warehouse admin...');

    const username = this.parseWarehouseUsername(dto);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      await ensureUsernameAvailable(this.prisma, username, existingUser.id);

      if (existingUser.usertype === 'btech-distribution') {
        this.logger.log(`User ${existingUser.email} already onboarded as Btech Distribution`);
        const updated =
          username !== undefined
            ? await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { username },
              })
            : existingUser;
        return ResponseHelper.success('User is already onboarded as Best Technologies Electronics Admin', {
          id: updated.id,
          email: updated.email,
          username: updated.username,
          first_name: updated.first_name,
          last_name: updated.last_name,
          role: updated.role,
          usertype: updated.usertype,
          message: 'User is already onboarded as Best Technologies Electronics Admin',
        });
      }

      // User exists but usertype is null or different – set usertype and role
      const updated = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          usertype: 'btech-distribution',
          role: 'admin',
          ...(dto.first_name && { first_name: dto.first_name }),
          ...(dto.last_name && { last_name: dto.last_name }),
          ...(dto.phone_number !== undefined && { phone_number: dto.phone_number ?? null }),
          ...(username !== undefined && { username }),
        },
      });

      this.logger.log(`Existing user onboarded as Btech Distribution: ${updated.email}`);
      return ResponseHelper.success('User onboarded as Best Technologies Electronics Admin', {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        first_name: updated.first_name,
        last_name: updated.last_name,
        role: updated.role,
        usertype: updated.usertype,
        message: 'Existing user onboarded as Best Technologies Electronics Admin',
      });
    }

    await ensureUsernameAvailable(this.prisma, username);

    const password =
      dto.password ??
      crypto.randomBytes(8).toString('base64url').slice(0, 12);
    const hashedPassword = await argon.hash(password);

    const user = await this.prisma.user.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        phone_number: dto.phone_number ?? null,
        role: 'admin',
        store_id: null,
        usertype: 'btech-distribution', // Hardcoded – not expected from frontend
        ...(username !== undefined ? { username } : {}),
      },
    });

    this.logger.log(`Warehouse admin onboarded: ${user.email}`);

    return ResponseHelper.created('Warehouse admin onboarded successfully', {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      usertype: user.usertype,
      createdAt: user.createdAt,
      ...(!dto.password && {
        temporaryPassword: password,
        message:
          'Please share the temporary password with the warehouse admin securely. They should change it on first login.',
      }),
    });
  }

  private parseWarehouseUsername(dto: OnboardWarehouseAdminDTO): string | undefined {
    const u = normalizeUsernameInput(dto.username);
    if (u !== undefined && !USERNAME_REGEX.test(u)) {
      throw new BadRequestException(
        'Username must be 3–30 characters: lowercase letters, numbers, underscore only',
      );
    }
    return u;
  }
}
