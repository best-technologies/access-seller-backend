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

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onboardWarehouseAdmin(dto: OnboardWarehouseAdminDTO) {
    this.logger.log('Onboarding new warehouse admin...');

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      if (existingUser.usertype === 'btech-distribution') {
        this.logger.log(`User ${existingUser.email} already onboarded as Btech Distribution`);
        return ResponseHelper.success('User is already onboarded as Best Technologies Electronics Admin', {
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          role: existingUser.role,
          usertype: existingUser.usertype,
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
        },
      });

      this.logger.log(`Existing user onboarded as Btech Distribution: ${updated.email}`);
      return ResponseHelper.success('User onboarded as Best Technologies Electronics Admin', {
        id: updated.id,
        email: updated.email,
        first_name: updated.first_name,
        last_name: updated.last_name,
        role: updated.role,
        usertype: updated.usertype,
        message: 'Existing user onboarded as Best Technologies Electronics Admin',
      });
    }

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
      },
    });

    this.logger.log(`Warehouse admin onboarded: ${user.email}`);

    return ResponseHelper.created('Warehouse admin onboarded successfully', {
      id: user.id,
      email: user.email,
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
}
