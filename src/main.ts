import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import axios from 'axios';
import { AppService } from './app.service';

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
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: false, // Disable if not needed
    forbidNonWhitelisted: true,
  }));
  await app.listen(process.env.PORT || 3000);

  // Get AppService instance from Nest application context

  // Cron job setup
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('*/10 * * * *', async () => {
      logger.log('Running a task every 10 minutes');
      try {
        const url = 'https://access-seller-backend.onrender.com/api/v1/hello';
        const response = await axios.get(url);
        logger.log(`Pinged endpoint, response: ${JSON.stringify(response.data)}`);
      } catch (err) {
        logger.error(`Error pinging endpoint: ${err.message}`);
      }
    });
  }

  logger.log(`Server is running on port ${process.env.PORT ?? 2000}`);
}
bootstrap();
