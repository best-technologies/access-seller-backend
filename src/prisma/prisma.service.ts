import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger;
  constructor(configService: ConfigService) {
    const dbUrl = configService.get<string>('database.url');
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    this.logger = new Logger(PrismaService.name);
    this.logger.log('Connecting to database: ' + dbUrl);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to the database');
  }
}
