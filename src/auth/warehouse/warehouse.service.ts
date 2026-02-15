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
      this.logger.warn('Warehouse admin with this email already exists');
      throw new BadRequestException('A user with this email already exists');
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
      },
    });

    this.logger.log(`Warehouse admin onboarded: ${user.email}`);

    return ResponseHelper.created('Warehouse admin onboarded successfully', {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      createdAt: user.createdAt,
      ...(!dto.password && {
        temporaryPassword: password,
        message:
          'Please share the temporary password with the warehouse admin securely. They should change it on first login.',
      }),
    });
  }
}
