import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cron from 'node-cron';
import axios from 'axios';
import { AppService } from './app.service';

async function bootstrap() {
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
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('*/10 * * * *', async () => {
      console.log('Running a task every 10 minutes');
      try {
        const url = 'https://access-seller-backend.onrender.com/api/v1/hello';
        const response = await axios.get(url);
        console.log('Pinged endpoint, response:', response.data);
      } catch (err) {
        console.error('Error pinging endpoint:', err.message);
      }
    });
  }

  console.log("Server is running on port", process.env.PORT ?? 2000);
}
bootstrap();
