import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Enable CORS
  app.enableCors({
    origin: [
      'https://pre-pe.com',
      'https://www.pre-pe.com',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new TimeoutInterceptor(),
  );

  // Root health check
  app.use((req: any, res: any, next: any) => {
    const cleanPath = req.path.replace(/\/+$/, '');

    if (cleanPath === '' || cleanPath === '/api') {
      return res.json({
        status: 'ok',
        service: 'PrePe Backend API',
        time: new Date().toISOString(),
        pid: process.pid,
      });
    }

    next();
  });

  app.use('/api/health', (req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'PrePe Backend API',
      time: new Date().toISOString(),
      pid: process.pid,
    });
  });

  const port = process.env.PORT ?? 3000;

  console.log('--------------------------------------------------');
  console.log('🚀 [BOOTSTRAP] PRE-PE BACKEND STARTING...');
  console.log(`📡 [BOOTSTRAP] Port: ${port}`);
  console.log(`🌍 [BOOTSTRAP] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('--------------------------------------------------');

  await app.listen(port, '0.0.0.0');

  console.log(
    `✅ [BOOTSTRAP] Server successfully started and listening on ${port}`,
  );

  console.log(
    `🔗 [BOOTSTRAP] Health Check: http://localhost:${port}/api/health`,
  );
}

bootstrap();