import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import * as cron from 'node-cron';
import axios from 'axios';
import { PrismaService } from './prisma/prisma.service';
import { sendCronErrorNotification } from './shared/helper-functions/cron-notification.helper';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Global error handler for unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    // Log but don't crash - let the app continue running
  });

  // Global error handler for uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`, error.stack);
    // Log but don't crash - let the app continue running
  });

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Access Sellr API')
    .setDescription('REST API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Mount outside global prefix so UI is at /api/docs (not /api/v1/docs)
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Setup Morgan logging middleware with custom format
  const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.log(`[HTTP Request] ${message.trim()}`);
      },
    },
  }));

  // Custom request logging middleware for better endpoint tracking
  app.use((req, res, next) => {
    // const start = Date.now();
    const { method, url } = req;
    
    // Log the incoming request
    logger.log(`🚀 [${method}] ${url}`);
    
    // Log response when it finishes
    // res.on('finish', () => {
    //   const duration = Date.now() - start;
    //   const { statusCode } = res;
      
    //   // Color coding based on status
    //   let statusEmoji = '✅';
    //   if (statusCode >= 400) statusEmoji = '❌';
    //   else if (statusCode >= 300) statusEmoji = '⚠️';
      
    //   logger.log(`${statusEmoji} [${method}] ${url} - ${statusCode} (${duration}ms)`);
    // });
    
    next();
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: false, // Disable if not needed
    forbidNonWhitelisted: false, // Changed to false to allow unknown properties (like files)
  }));
  await app.listen(process.env.PORT || 3000);

  // Get PrismaService instance from Nest application context
  const prismaService = app.get(PrismaService);

  /**
   * Cron job setup for health check monitoring
   * 
   * IMPORTANT LIMITATION:
   * This cron job runs ON the server itself. If the server is completely DOWN:
   * - The cron job cannot execute
   * - Email notifications will NOT be sent
   * 
   * This solution works for:
   * ✅ Server is UP but endpoint ping fails (network issues, timeout, 500 errors)
   * ✅ Server is UP but has internal errors during cron execution
   * ✅ Server is UP but database/email service has issues (uses fallback)
   * 
   * For complete server-down scenarios, consider:
   * - External monitoring services (UptimeRobot, Pingdom, StatusCake)
   * - Separate monitoring server that pings this server
   * - Render's built-in health checks and alerts
   */
  // Cron job setup
  if (process.env.CRON_ENV === 'production' || process.env.NODE_ENV === "production") {
    cron.schedule('*/9 * * * *', async () => { // Run every 9 minutes
      // Wrap entire cron execution in try-catch to catch ANY errors
      try {
        logger.log('Running health check cron job...'); 
        const url = 'https://access-seller-prod.onrender.com/api/v1/hello';
        const timestamp = new Date().toLocaleString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        try {
          const response = await axios.get(url, {
            timeout: 10000, // 10 second timeout
          });
          logger.log(`✅ Health check successful: ${JSON.stringify(response.data)}`);
        } catch (err: any) {
          // Health check ping failed
          const errorMessage = err.message || 'Unknown error occurred';
          const errorDetails = err.response 
            ? `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`
            : err.stack || 'No additional details available';

          logger.error(`❌ Health check failed: ${errorMessage}`);
          
          // Send email to all admins
          await sendCronErrorNotification(
            prismaService,
            errorMessage,
            errorDetails,
            url,
            timestamp
          );
        }
      } catch (cronError: any) {
        // Cron job itself failed (before or during execution)
        const errorMessage = `Cron service execution error: ${cronError.message || 'Unknown error'}`;
        const errorDetails = cronError.stack || 'Cron job failed to execute properly';
        const timestamp = new Date().toLocaleString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const url = 'https://access-seller-prod.onrender.com/api/v1/hello';

        logger.error(`💥 CRITICAL: Cron job execution failed: ${errorMessage}`);
        
        // Try to send error notification even if cron itself failed
        await sendCronErrorNotification(
          prismaService,
          errorMessage,
          errorDetails,
          url,
          timestamp
        );
      }
    });
  }

  logger.log(`Server is running on port ${process.env.PORT ?? 2000}`);
}
bootstrap();
