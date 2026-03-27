import { ConfigService } from '@nestjs/config';
import { AvendorModuleAccessLevel } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * If email is in DEVELOPER_BOOTSTRAP_EMAILS (config: developerBootstrapEmails), ensure an
 * AvendorPermission row exists with onboarding full_access (so list/create/patch work without super_admin).
 */
export async function ensureBootstrapAvendorPermissionRow(
  prisma: PrismaService,
  config: ConfigService,
  userId: string,
  email: string | undefined,
): Promise<void> {
  const bootstrap = config.get<string[]>('developerBootstrapEmails', []);
  const normalized = (email || '').toLowerCase();
  if (!normalized || !bootstrap.includes(normalized)) {
    return;
  }

  await prisma.avendorPermission.upsert({
    where: { userId },
    create: {
      userId,
      onboarding: AvendorModuleAccessLevel.full_access,
    },
    update: {
      onboarding: AvendorModuleAccessLevel.full_access,
    },
  });
}
