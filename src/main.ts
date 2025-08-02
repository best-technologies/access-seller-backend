import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import axios from 'axios';
import { AppService } from './app.service';
import * as morgan from 'morgan';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  
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

  // Get AppService instance from Nest application context

  // Cron job setup
  // if (process.env.CRON_ENV === 'production' || process.env.NODE_ENV === "production") {
  //   cron.schedule('*/10 * * * *', async () => {
  //     logger.log('Running a task every 10 minutes'); 
  //     try {
  //       const url = 'https://access-seller-backend.onrender.com/api/v1/hello';
  //       const response = await axios.get(url);
  //       logger.log(`Pinged endpoint, response: ${JSON.stringify(response.data)}`);
  //     } catch (err) {
  //       logger.error(`Error pinging endpoint: ${err.message}`);
  //     }
  //   });
  // }

  logger.log(`Server is running on port ${process.env.PORT ?? 2000}`);
}
bootstrap();
