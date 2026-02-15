import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogInput {
  actionType: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actionType: input.actionType,
          userId: input.userId,
          userEmail: input.userEmail,
          userName: input.userName,
          entityType: input.entityType,
          entityId: input.entityId,
          description: input.description,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error}`);
      // Don't throw - audit failure shouldn't break the main flow
    }
  }
}
