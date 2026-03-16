import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import * as colors from 'colors';
import { CreateCommissionReferralConfigDto } from './dto/create-commission-referral-config.dto';
import { UpdateCommissionReferralConfigDto } from './dto/update-commission-referral-config.dto';

@Injectable()
export class CommissionReferralConfigService {
  private readonly logger = new Logger(CommissionReferralConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommissionReferralConfigDto, adminUser: any) {
    this.logger.log(colors.cyan('🧮 Creating new commission referral config...'));

    const { minAmount, maxAmount, percentage } = dto;

    if (maxAmount !== undefined && maxAmount !== null && maxAmount <= minAmount) {
      this.logger.warn(
        colors.yellow(
          `⚠️ Invalid range: maxAmount (${maxAmount}) must be greater than minAmount (${minAmount})`,
        ),
      );
      throw new BadRequestException('maxAmount must be greater than minAmount');
    }

    // Fetch all existing active configs ordered by minAmount
    const existing = await this.prisma.commissionReferralConfig.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' },
    });

    // Validate overlap
    this.ensureNoOverlap({ minAmount, maxAmount }, existing);

    // Validate monotonic percentage (higher amount => not lower percentage)
    this.ensureMonotonicPercentage({ minAmount, maxAmount, percentage }, existing);

    try {
      const created = await this.prisma.commissionReferralConfig.create({
        data: {
          minAmount,
          maxAmount: maxAmount ?? null,
          percentage,
          createdById: adminUser?.id ?? null,
        },
      });

      this.logger.log(
        colors.green(
          `✅ Commission config created: [${created.minAmount} - ${created.maxAmount ?? '∞'}] => ${
            created.percentage
          }%`,
        ),
      );

      return new ApiResponse(true, 'Commission referral config created successfully', created);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating commission referral config: ${error.message}`));
      throw error;
    }
  }

  async findAll() {
    this.logger.log(colors.cyan('📋 Fetching all commission referral configs...'));

    try {
      const configs = await this.prisma.commissionReferralConfig.findMany({
        orderBy: [{ minAmount: 'asc' }, { maxAmount: 'asc' }],
      });

      return new ApiResponse(true, 'Commission referral configs fetched successfully', configs);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching commission referral configs: ${error.message}`));
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(colors.cyan(`🔍 Fetching commission referral config with ID: ${id}`));

    const config = await this.prisma.commissionReferralConfig.findUnique({
      where: { id },
    });

    if (!config) {
      this.logger.warn(colors.yellow(`⚠️ Commission referral config with ID ${id} not found`));
      throw new NotFoundException('Commission referral config not found');
    }

    return new ApiResponse(true, 'Commission referral config fetched successfully', config);
  }

  async update(id: string, dto: UpdateCommissionReferralConfigDto) {
    this.logger.log(colors.cyan(`🔄 Updating commission referral config with ID: ${id}`));

    const existingConfig = await this.prisma.commissionReferralConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      this.logger.warn(colors.yellow(`⚠️ Commission referral config with ID ${id} not found`));
      throw new NotFoundException('Commission referral config not found');
    }

    const minAmount = dto.minAmount ?? existingConfig.minAmount;
    const maxAmount =
      dto.maxAmount !== undefined ? dto.maxAmount : existingConfig.maxAmount ?? null;
    const percentage = dto.percentage ?? existingConfig.percentage;

    if (maxAmount !== null && maxAmount <= minAmount) {
      this.logger.warn(
        colors.yellow(
          `⚠️ Invalid range on update: maxAmount (${maxAmount}) must be greater than minAmount (${minAmount})`,
        ),
      );
      throw new BadRequestException('maxAmount must be greater than minAmount');
    }

    const others = await this.prisma.commissionReferralConfig.findMany({
      where: { id: { not: id }, isActive: true },
      orderBy: { minAmount: 'asc' },
    });

    this.ensureNoOverlap({ minAmount, maxAmount }, others);
    this.ensureMonotonicPercentage({ minAmount, maxAmount, percentage }, others);

    try {
      const updated = await this.prisma.commissionReferralConfig.update({
        where: { id },
        data: {
          minAmount,
          maxAmount,
          percentage,
        },
      });

      this.logger.log(
        colors.green(
          `✅ Commission config updated: [${updated.minAmount} - ${updated.maxAmount ?? '∞'}] => ${
            updated.percentage
          }%`,
        ),
      );

      return new ApiResponse(true, 'Commission referral config updated successfully', updated);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating commission referral config: ${error.message}`));
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(colors.cyan(`🗑️ Deleting commission referral config with ID: ${id}`));

    const existingConfig = await this.prisma.commissionReferralConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      this.logger.warn(colors.yellow(`⚠️ Commission referral config with ID ${id} not found`));
      throw new NotFoundException('Commission referral config not found');
    }

    try {
      await this.prisma.commissionReferralConfig.delete({
        where: { id },
      });

      this.logger.log(colors.green(`✅ Commission referral config deleted: ${id}`));
      return new ApiResponse(true, 'Commission referral config deleted successfully');
    } catch (error) {
      this.logger.error(colors.red(`❌ Error deleting commission referral config: ${error.message}`));
      throw error;
    }
  }

  /**
   * Helper used by payment flows to calculate commission percentage
   * based on configured ranges. Falls back to 0 if nothing matches.
   */
  async calculatePercentageForAmount(totalPurchaseAmount: number): Promise<number> {
    const amount = Number(totalPurchaseAmount) || 0;
    if (amount <= 0) return 0;

    const configs = await this.prisma.commissionReferralConfig.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' },
    });

    if (!configs.length) {
      this.logger.warn(
        colors.yellow(
          '⚠️ No commission referral configs found in DB – commission defaults to 0%',
        ),
      );
      return 0;
    }

    for (const cfg of configs) {
      const min = cfg.minAmount;
      const max = cfg.maxAmount ?? Number.POSITIVE_INFINITY;
      if (amount >= min && amount <= max) {
        this.logger.log(
          colors.cyan(
            `📈 Matched commission config [${min} - ${cfg.maxAmount ?? '∞'}] => ${
              cfg.percentage
            }% for amount ${amount}`,
          ),
        );
        return cfg.percentage;
      }
    }

    // If nothing matches (e.g., gaps), use the highest applicable band below
    const belowBands = configs.filter((c) => c.minAmount <= amount);
    if (belowBands.length) {
      const highest = belowBands[belowBands.length - 1];
      this.logger.log(
        colors.cyan(
          `📈 Using highest below-band [${highest.minAmount} - ${
            highest.maxAmount ?? '∞'
          }] => ${highest.percentage}% for amount ${amount}`,
        ),
      );
      return highest.percentage;
    }

    this.logger.warn(
      colors.yellow(
        `⚠️ No commission config matched amount ${amount}; falling back to 0% commission`,
      ),
    );
    return 0;
  }

  private ensureNoOverlap(
    target: { minAmount: number; maxAmount: number | null | undefined },
    existing: Array<{ minAmount: number; maxAmount: number | null }>,
  ) {
    const newMin = target.minAmount;
    const newMax = target.maxAmount ?? Number.POSITIVE_INFINITY;

    for (const cfg of existing) {
      const eMin = cfg.minAmount;
      const eMax = cfg.maxAmount ?? Number.POSITIVE_INFINITY;

      const overlaps = newMin <= eMax && eMin <= newMax;
      if (overlaps) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Overlapping commission range detected with existing band [${eMin} - ${
              cfg.maxAmount ?? '∞'
            }]`,
          ),
        );
        throw new BadRequestException(
          `Commission range overlaps with existing range [${eMin} - ${cfg.maxAmount ?? '∞'}]`,
        );
      }
    }
  }

  private ensureMonotonicPercentage(
    target: { minAmount: number; maxAmount: number | null | undefined; percentage: number },
    existing: Array<{ minAmount: number; maxAmount: number | null; percentage: number }>,
  ) {
    const newMin = target.minAmount;
    const newMax = target.maxAmount ?? Number.POSITIVE_INFINITY;
    const newPct = target.percentage;

    if (newPct < 0) {
      throw new BadRequestException('percentage cannot be negative');
    }

    // All bands strictly below this new band (by maxAmount)
    const lowerBands = existing.filter((b) => (b.maxAmount ?? Number.POSITIVE_INFINITY) < newMin);
    if (lowerBands.length) {
      const maxLowerPct = Math.max(...lowerBands.map((b) => b.percentage));
      if (newPct < maxLowerPct) {
        this.logger.warn(
          colors.yellow(
            `⚠️ New percentage ${newPct}% is lower than existing lower band percentage ${maxLowerPct}%`,
          ),
        );
        throw new BadRequestException(
          `percentage must be at least ${maxLowerPct}% to keep commission non-decreasing`,
        );
      }
    }

    // All bands strictly above this new band (by minAmount)
    const higherBands = existing.filter((b) => b.minAmount > newMax);
    if (higherBands.length) {
      const minHigherPct = Math.min(...higherBands.map((b) => b.percentage));
      if (minHigherPct < newPct) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Existing higher band percentage ${minHigherPct}% is lower than new percentage ${newPct}%`,
          ),
        );
        throw new BadRequestException(
          `percentage cannot be higher than a higher-amount band (${minHigherPct}%) – update higher bands first`,
        );
      }
    }
  }
}

