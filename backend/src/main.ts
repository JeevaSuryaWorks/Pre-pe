import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Custom CORS middleware to avoid conflicts with Nginx adding headers in production
    app.use((req: any, res: any, next: any) => {
        const origin = req.headers.origin;
        const allowedOrigins = [
            'https://pre-pe.com',
            'https://www.pre-pe.com',
            'http://localhost:8080',
            'http://localhost:5173'
        ];

        // 1. Handle Preflight (OPTIONS)
        if (req.method === 'OPTIONS') {
            if (origin && (allowedOrigins.includes(origin) || origin.includes('pre-pe.com') || origin.startsWith('http://localhost'))) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                return res.status(204).send();
            }
        }

        // 2. Handle Actual Requests
        if (origin && (allowedOrigins.includes(origin) || origin.includes('pre-pe.com') || origin.startsWith('http://localhost'))) {
            // For production (pre-pe.com), we only add headers if Nginx hasn't added them yet.
            // Since we can't easily detect Nginx headers here, and we know Nginx adds them,
            // we should avoid adding them here to prevent the "multiple values" error.
            if (!origin.includes('pre-pe.com')) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
        }

        next();
    });
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
