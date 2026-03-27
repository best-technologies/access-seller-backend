import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** Lowercase letters, digits, underscore; length 3–30. */
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function normalizeUsernameInput(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  return s.toLowerCase();
}

/**
 * Ensures `username` is not taken by another user. Skips when username is undefined.
 */
export async function ensureUsernameAvailable(
  prisma: PrismaService,
  username: string | undefined,
  exceptUserId?: string,
): Promise<void> {
  if (!username) return;
  const row = await prisma.user.findUnique({ where: { username } });
  if (row && row.id !== exceptUserId) {
    throw new BadRequestException('Username is already taken');
  }
}
