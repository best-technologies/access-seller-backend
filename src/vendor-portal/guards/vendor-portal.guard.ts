import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AllowedPlatformTypeForAdmin, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';

/**
 * Context attached to the request after this guard runs. Controllers pull it via
 * a typed cast of `req.vendorPortal` (see {@link getVendorPortalContext}).
 */
export interface VendorPortalContext {
  userId: string;
  email: string;
  vendorId: string;
}

/**
 * Reads `req.user` (set by `JwtGuard`), loads the backing User row, and ensures
 * the user is actually a linked supplier: `is_a_vendor === true` and an
 * `avendorVendorId` FK pointing at an existing `AvendorVendor`.
 *
 * On success, stashes `{ userId, email, vendorId }` on `req.vendorPortal` so
 * downstream controllers/services don't have to re-query.
 */
@Injectable()
export class VendorPortalGuard implements CanActivate {
  private readonly logger = new Logger(VendorPortalGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log(colors.cyan('Vendor portal guard: checking access'));
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id as string | undefined;

    if (!userId) {
      this.logger.warn(colors.red(`Vendor portal access: no userId`));
      throw new ForbiddenException('Authentication required');
    }

    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_a_vendor: true,
        is_active: true,
        avendorVendorId: true,
        allowedPlatformsForUser: true,
      },
    });

    if (!user) {
      this.logger.warn(colors.red(`Vendor portal access: user ${userId} not found`));
      throw new ForbiddenException('User not found');
    }

    if (!user.is_active) {
      this.logger.warn(colors.red(`Vendor portal access: user ${userId} is not active`));
      throw new ForbiddenException('Your account is not active');
    }

    // log user details
    this.logger.log(colors.magenta(`Vendor portal access: user ${userId} details: ${JSON.stringify(user)}`));

    // Heal: FK set but `is_a_vendor` out of sync (e.g. manual DB edits)
    if (user.avendorVendorId && !user.is_a_vendor) {
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { is_a_vendor: true },
        select: {
          id: true,
          email: true,
          is_a_vendor: true,
          is_active: true,
          avendorVendorId: true,
          allowedPlatformsForUser: true,
        },
      });
    }

    if (!user.avendorVendorId) {
      this.logger.log(colors.yellow(`Vendor portal: no avendorVendorId for user=${userId}`));
      user = (await this.tryLinkUserToSupplierByEmail(user)) ?? user;
    }

    if (!user.is_a_vendor || !user.avendorVendorId) {
      this.logger.warn(
        colors.yellow(
          `Vendor portal denied for user=${userId} is_a_vendor=${user.is_a_vendor} avendorVendorId=${user.avendorVendorId ?? 'null'}`,
        ),
      );
      throw new ForbiddenException(
        'Your login is not linked to a supplier account yet. Please contact the A-Vendor admin to get access.',
      );
    }

    const vendor = await this.prisma.avendorVendor.findUnique({
      where: { id: user.avendorVendorId },
      select: { id: true, status: true },
    });
    if (!vendor) {
      throw new ForbiddenException(
        'The supplier record linked to your login no longer exists. Contact the A-Vendor admin.',
      );
    }

    const ctx: VendorPortalContext = {
      userId: user.id,
      email: user.email,
      vendorId: vendor.id,
    };
    (req as Request & { vendorPortal?: VendorPortalContext }).vendorPortal = ctx;

    return true;
  }

  /**
   * If there is exactly one `AvendorVendor` with the same email as the user, and no
   * other user is already linked to that vendor, link this user (e.g. supplier
   * row was created before user onboarding, or A-Vendor admin has not used user management).
   */
  private async tryLinkUserToSupplierByEmail(
    user: {
      id: string;
      email: string;
      is_a_vendor: boolean;
      is_active: boolean;
      avendorVendorId: string | null;
      allowedPlatformsForUser: AllowedPlatformTypeForAdmin[];
    },
  ): Promise<typeof user | null> {
    const mailKeys = this.normalizeEmailForLink(user.email);
    if (!mailKeys.normalized) {
      this.logger.warn(`Vendor portal: empty email on user ${user.id}; auto-link skipped`);
      return null;
    }

    let matches: { id: string }[] = await this.prisma.avendorVendor.findMany({
      where: { email: { equals: mailKeys.normalized, mode: 'insensitive' } },
      select: { id: true },
    });

    // DB may have been saved without trim; `User.email` may still have leading/trailing space.
    if (matches.length === 0) {
      const byTrim = await this.prisma.$queryRaw<[{ id: string }]>(
        Prisma.sql`
          SELECT id::text AS id
          FROM "AvendorVendor"
          WHERE LOWER(TRIM("email")) = ${mailKeys.normalized}
        `,
      );
      if (byTrim.length > 0) {
        this.logger.log(
          `Vendor portal: found supplier by TRIM/LOWER(email) (User vs AvendorVendor email spacing mismatch) for user ${user.id}`,
        );
        matches = byTrim;
      }
    }

    if (matches.length === 0) {
      this.logger.warn(
        `Vendor portal: no AvendorVendor with email like "${mailKeys.normalized}" for user ${user.id} (auto-link skipped)`,
      );
      return null;
    }
    if (matches.length > 1) {
      this.logger.warn(
        `Vendor portal: ${matches.length} suppliers share this email; cannot auto-link user ${user.id}`,
      );
      return null;
    }
    const vendorId = matches[0].id;
    const other = await this.prisma.user.findFirst({
      where: { avendorVendorId: vendorId, id: { not: user.id } },
      select: { id: true },
    });
    if (other) {
      this.logger.warn(
        `Vendor portal: supplier ${vendorId} already linked to user ${other.id}; cannot auto-link ${user.id}`,
      );
      return null;
    }

    const merged = new Set([
      ...(user.allowedPlatformsForUser ?? []),
      AllowedPlatformTypeForAdmin.avendor,
    ]);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_a_vendor: true,
        avendorVendorId: vendorId,
        allowedPlatformsForUser: Array.from(merged),
        ...(user.email !== mailKeys.normalized && mailKeys.normalized
          ? { email: mailKeys.normalized }
          : {}),
      },
      select: {
        id: true,
        email: true,
        is_a_vendor: true,
        is_active: true,
        avendorVendorId: true,
        allowedPlatformsForUser: true,
      },
    });

    this.logger.log(
      colors.green(
        `Vendor portal: auto-linked userId=${user.id} → vendorId=${vendorId} (email match)`,
      ),
    );
    return updated;
  }

  /** `User.email` and `AvendorVendor.email` are separate columns; this aligns lookup with how we store suppliers. */
  private normalizeEmailForLink(email: string): { normalized: string } {
    const normalized = email.replace(/\s+/g, ' ').trim().toLowerCase();
    return { normalized };
  }
}

/**
 * Typed accessor for the context the guard attaches to the request. Keeps
 * controllers from reaching into `req` with `any`.
 */
export function getVendorPortalContext(req: unknown): VendorPortalContext {
  const ctx = (req as { vendorPortal?: VendorPortalContext }).vendorPortal;
  if (!ctx) {
    throw new ForbiddenException('Vendor portal context missing; guard not applied');
  }
  return ctx;
}
