import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as argon from 'argon2';
import { AllowedPlatformTypeForAdmin } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { StorageService } from 'src/shared/services/storage.service';
import type { StorageUploadResult } from 'src/shared/services/storage.types';
import { OnboardVendorAdminDto } from './dto/vendor.dto';
import {
  mapApiPlatformsToPrisma,
  mapPrismaPlatformsToApi,
} from 'src/shared/constants/admin-platform-access.constants';
import { DEFAULT_AVENDOR_ADMIN_PASSWORD } from './constants/a-vendor-auth.constants';
import {
  A_VENDOR_DISPLAY_PIC_BASENAME_PREFIX,
  A_VENDOR_USER_STORAGE_FOLDER,
} from './constants/a-vendor-storage.constants';
import {
  ensureUsernameAvailable,
  normalizeUsernameInput,
  USERNAME_REGEX,
} from 'src/shared/utils/username.util';
import * as colors from 'colors';

/** Matches onboarding style for other verticals (e.g. warehouse). */
const USERTYPE_AVENDOR_ADMIN = 'avendor-admin';

const DISPLAY_PIC_MIMES = new Set(['image/jpeg', 'image/png']);

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async onboardVendorAdmin(
    dto: OnboardVendorAdminDto,
    displayPicture?: Express.Multer.File,
  ) {
    this.logger.log(`Onboarding vendor admin: email=${dto.email.toLowerCase()}`);

    const email = dto.email.toLowerCase();
    const platformSet = this.resolvePlatformsForOnboard(dto);
    const username = this.parseUsername(dto);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.log(colors.yellow(`User ${existingUser.email} already exists`));
      return this.handleExistingUserForVendorAdmin(
        existingUser,
        dto,
        platformSet,
        displayPicture,
        username,
      );
    }

    const hashedPassword = await argon.hash(DEFAULT_AVENDOR_ADMIN_PASSWORD);

    let uploaded: StorageUploadResult[] = [];
    let displayPictureUrl: string | undefined;
    try {
      await ensureUsernameAvailable(this.prisma, username);

      const uploadOutcome = await this.uploadDisplayPictureIfPresent(
        displayPicture,
      );
      displayPictureUrl = uploadOutcome?.url;
      uploaded = uploadOutcome?.results ?? [];

      const user = await this.prisma.user.create({
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email,
          password: hashedPassword,
          phone_number: dto.phone_number ?? null,
          role: 'admin',
          store_id: null,
          usertype: USERTYPE_AVENDOR_ADMIN,
          allowedPlatformsForAdmin: platformSet,
          display_picture: displayPictureUrl ?? null,
          ...(username !== undefined ? { username } : {}),
        },
      });

      await this.ensureAvendorPermissionForUser(user.id);

      this.logger.log(
        `Vendor admin created: email=${user.email}: username=${username}: platforms=${platformSet.join(',')}`,
      );

      return ResponseHelper.created('Vendor admin onboarded successfully', {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        usertype: user.usertype,
        allowed_platforms: mapPrismaPlatformsToApi(user.allowedPlatformsForAdmin),
        display_picture: user.display_picture,
        username: user.username,
        createdAt: user.createdAt,
        defaultPassword: DEFAULT_AVENDOR_ADMIN_PASSWORD,
        message:
          'Default password is set server-side. Share it securely with the admin and ask them to change it after first login.',
      });
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      this.logger.error(
        `Vendor admin onboard failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  /**
   * Uploads to configured provider under folder `a-vendor/user` with basename `display-pic-{5 alnum}`.
   */
  private async uploadDisplayPictureIfPresent(
    file: Express.Multer.File | undefined,
  ): Promise<{ url: string; results: StorageUploadResult[] } | undefined> {
    if (!file?.buffer?.length) {
      return undefined;
    }

    if (!DISPLAY_PIC_MIMES.has(file.mimetype)) {
      this.logger.warn(
        `Rejected display_picture: invalid mimetype ${file.mimetype}`,
      );
      throw new BadRequestException(
        'Display picture must be a JPEG or PNG image',
      );
    }

    this.logger.log(
      `Uploading display_picture to ${A_VENDOR_USER_STORAGE_FOLDER} (${file.mimetype})`,
    );

    const results = await this.storage.upload(
      [file],
      A_VENDOR_USER_STORAGE_FOLDER,
      { basenamePrefix: A_VENDOR_DISPLAY_PIC_BASENAME_PREFIX },
    );
    const [result] = results;

    this.logger.log(
      `Display picture stored: public_id=${result.public_id}`,
    );

    return { url: result.secure_url, results };
  }

  private resolvePlatformsForOnboard(
    dto: OnboardVendorAdminDto,
  ): AllowedPlatformTypeForAdmin[] {
    if (dto.allowed_platforms?.length) {
      return [...new Set(mapApiPlatformsToPrisma(dto.allowed_platforms))];
    }
    return [AllowedPlatformTypeForAdmin.avendor];
  }

  /** Normalizes and validates optional username from DTO (multipart-safe). */
  private parseUsername(dto: OnboardVendorAdminDto): string | undefined {
    const u = normalizeUsernameInput(dto.username);
    if (u !== undefined && !USERNAME_REGEX.test(u)) {
      this.logger.warn(colors.yellow(`Invalid username: ${u}`));
      throw new BadRequestException(
        'Username must be 3–30 characters: lowercase letters, numbers, underscore only',
      );
    }
    return u;
  }

  private async handleExistingUserForVendorAdmin(
    existingUser: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      usertype: string | null;
      allowedPlatformsForAdmin: AllowedPlatformTypeForAdmin[];
      username: string | null;
    },
    dto: OnboardVendorAdminDto,
    platformsToEnsure: AllowedPlatformTypeForAdmin[],
    displayPicture: Express.Multer.File | undefined,
    username: string | undefined,
  ) {
    const current = existingUser.allowedPlatformsForAdmin ?? [];
    const hasAll = platformsToEnsure.every((p) => current.includes(p));

    let uploaded: StorageUploadResult[] = [];
    let displayPictureUrl: string | undefined;
    try {
      await ensureUsernameAvailable(this.prisma, username, existingUser.id);

      const uploadOutcome = await this.uploadDisplayPictureIfPresent(
        displayPicture,
      );
      displayPictureUrl = uploadOutcome?.url;
      uploaded = uploadOutcome?.results ?? [];

      const mergedPreview = hasAll
        ? current
        : [...new Set([...current, ...platformsToEnsure])];
      if (mergedPreview.includes(AllowedPlatformTypeForAdmin.avendor)) {
        await this.ensureAvendorPermissionForUser(existingUser.id);
      }

      if (hasAll) {
        const profilePatch = {
          ...(displayPictureUrl && { display_picture: displayPictureUrl }),
          ...(dto.first_name && { first_name: dto.first_name }),
          ...(dto.last_name && { last_name: dto.last_name }),
          ...(dto.phone_number !== undefined && {
            phone_number: dto.phone_number ?? null,
          }),
          ...(username !== undefined && { username }),
        };
        const hasProfilePatch = Object.keys(profilePatch).length > 0;

        if (hasProfilePatch) {
          const updated = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: profilePatch,
          });
          this.logger.log(
            `User ${existingUser.email} already had platform access; profile updated`,
          );
          return ResponseHelper.success(
            'User already has the requested A-Vendor platform access',
            {
              id: updated.id,
              email: updated.email,
              username: updated.username,
              first_name: updated.first_name,
              last_name: updated.last_name,
              role: updated.role,
              usertype: updated.usertype,
              allowed_platforms: mapPrismaPlatformsToApi(
                updated.allowedPlatformsForAdmin,
              ),
              display_picture: updated.display_picture,
              message:
                'Platform access unchanged; profile fields updated where provided',
            },
          );
        }

        this.logger.log(
          `User ${existingUser.email} already has requested vendor platform access (idempotent)`,
        );
        return ResponseHelper.success(
          'User already has the requested A-Vendor platform access',
          {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            role: existingUser.role,
            usertype: existingUser.usertype,
            allowed_platforms: mapPrismaPlatformsToApi(current),
            message:
              'User already has the requested platform permissions; no changes applied',
          },
        );
      }

      const merged = [...new Set([...current, ...platformsToEnsure])];

      const updated = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'admin',
          allowedPlatformsForAdmin: merged,
          ...(existingUser.usertype == null && {
            usertype: USERTYPE_AVENDOR_ADMIN,
          }),
          ...(dto.first_name && { first_name: dto.first_name }),
          ...(dto.last_name && { last_name: dto.last_name }),
          ...(dto.phone_number !== undefined && {
            phone_number: dto.phone_number ?? null,
          }),
          ...(displayPictureUrl && { display_picture: displayPictureUrl }),
          ...(username !== undefined && { username }),
        },
      });

      this.logger.log(
        `Existing user granted vendor platform access: id=${updated.id} email=${updated.email} platforms=${merged.join(',')} usertype=${updated.usertype}`,
      );

      return ResponseHelper.success(
        'User onboarded as A-Vendor admin (platform access updated)',
        {
          id: updated.id,
          email: updated.email,
          first_name: updated.first_name,
          last_name: updated.last_name,
          role: updated.role,
          usertype: updated.usertype,
          allowed_platforms: mapPrismaPlatformsToApi(
            updated.allowedPlatformsForAdmin,
          ),
          display_picture: updated.display_picture,
          username: updated.username,
          message:
            'Existing user granted A-Vendor admin access and merged platform permissions',
        },
      );
    } catch (err) {
      await this.storage.cleanupUploadedFiles(uploaded);
      this.logger.error(
        `Existing user vendor onboard failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  /** Default matrix: all modules `view_only` (DB defaults). */
  private async ensureAvendorPermissionForUser(userId: string) {
    await this.prisma.avendorPermission.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    this.logger.log(`Ensured AvendorPermission row for userId=${userId}`);
  }
}
