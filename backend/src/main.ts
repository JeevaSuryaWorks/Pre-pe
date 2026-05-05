import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Custom CORS middleware to avoid conflicts with Nginx adding headers in production
    app.use((req: any, res: any, next: any) => {
        const origin = req.headers.origin;
        const allowedOrigins = [
            'http://localhost:8080',
            'http://localhost:5173'
        ];

        // In production (pre-pe.com), we let Nginx handle the Access-Control-Allow-Origin header.
        // If we add it here, the browser will see multiple values and block the request.
        if (origin && origin.includes('pre-pe.com')) {
            if (req.method === 'OPTIONS') {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
                return res.status(204).send();
            }
            return next();
        }

        // For development or other origins, we handle it normally
        if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost'))) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        }

        if (req.method === 'OPTIONS') {
            return res.status(204).send();
        }
        next();
    });
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
