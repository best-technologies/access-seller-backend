import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {}

  getHello(): string {
    const appName = this.configService.get<string>('APP_NAME', 'DefaultAppName');
    this.logger.log(`Application Name: ${appName}`);
    return 'Hello World!';
  }
}
