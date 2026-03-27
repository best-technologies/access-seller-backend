import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowedPlatformTypeForAdmin } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ensureBootstrapAvendorPermissionRow } from '../utils/avendor-bootstrap.util';

/**
 * Requires `avendor` in allowedPlatformsForAdmin, unless the user is
 * `super_admin` or their email is in DEVELOPER_BOOTSTRAP_EMAILS (.env).
 */
@Injectable()
export class AvendorPlatformGuard implements CanActivate {
  private readonly logger = new Logger(AvendorPlatformGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id as string | undefined;
    const jwtRole = req.user?.role as string | undefined;
    const jwtEmail = (req.user?.email as string | undefined)?.toLowerCase();

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    if (jwtRole === 'super_admin') {
      return true;
    }

    const developerEmails = this.config.get<string[]>('developerBootstrapEmails', []);
    if (jwtEmail && developerEmails.includes(jwtEmail)) {
      await ensureBootstrapAvendorPermissionRow(
        this.prisma,
        this.config,
        userId,
        jwtEmail,
      );
      this.logger.log(`A-Vendor access via DEVELOPER_BOOTSTRAP_EMAILS for ${jwtEmail}`);
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { allowedPlatformsForAdmin: true, email: true },
    });

    const platforms = user?.allowedPlatformsForAdmin ?? [];
    if (platforms.includes(AllowedPlatformTypeForAdmin.avendor)) {
      return true;
    }

    this.logger.warn(`A-Vendor access denied for user ${userId}`);
    throw new ForbiddenException(
      'A-Vendor platform access is required. Add your email to DEVELOPER_BOOTSTRAP_EMAILS (dev) or add avendor to allowedPlatformsForAdmin for this user.',
    );
  }
}
