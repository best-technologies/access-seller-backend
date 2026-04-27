import { randomInt } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** Lowercase letters, digits, underscore, hyphen; length 3–30. */
/** Hyphen is first in the class to avoid any range ambiguity with `9-_`. */
export const USERNAME_REGEX = /^[-a-z0-9_]{3,30}$/;

export const USERNAME_VALIDATION_MESSAGE =
  'Username must be 3–30 characters: lowercase letters, numbers, underscore, and hyphen only';

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

/**
 * A-Vendor auto-assigned login handles: `avd-<year>-<3-digit random>`, e.g. `avd-2026-013`.
 * Server-only; the `email` parameter is reserved for call-site compatibility and not used in generation.
 */
export async function allocateUniqueUsernameFromEmail(
  prisma: PrismaService,
  _email: string,
  exceptUserId?: string,
): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 2_000; attempt++) {
    const n = randomInt(0, 1000).toString().padStart(3, '0');
    const candidate = `avd-${year}-${n}`;
    const row = await prisma.user.findUnique({ where: { username: candidate } });
    if (!row || row.id === exceptUserId) {
      return candidate;
    }
  }
  throw new BadRequestException('Could not assign a unique username; try again');
}
