import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });
    
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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new TimeoutInterceptor());

    // Root-level health checker middleware to intercept pings before they throw 404s
    app.use((req: any, res: any, next: any) => {
        const cleanPath = req.path.replace(/\/+$/, ''); // Remove trailing slashes
        if (cleanPath === '' || cleanPath === '/api') {
            return res.json({ 
                status: 'ok', 
                service: 'PrePe Backend API',
                time: new Date().toISOString(),
                pid: process.pid
            });
        }
        next();
    });

    // Global health check
    app.use('/api/health', (req: any, res: any) => {
        res.json({ 
            status: 'ok', 
            time: new Date().toISOString(), 
            pid: process.pid,
            prefix: '/api'
        });
    });

    // Formal Exception Filter
    app.useGlobalFilters(new (class {
        catch(exception: any, host: any) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse();
            const request = ctx.getRequest();
            
            const status = 
                exception && typeof exception.getStatus === 'function' 
                    ? exception.getStatus() 
                    : (exception?.status || 500);

            const message = exception?.message || (typeof exception === 'string' ? exception : 'Internal server error');
            
            console.error(`[GlobalError] ${request.method} ${request.url} - Status: ${status} - Message: ${message}`);
            if (exception?.stack) console.error(exception.stack);

            const origin = request.headers.origin;
            if (origin && (origin.includes('pre-pe.com') || origin.includes('localhost') || origin.startsWith('http://localhost'))) {
                if (!origin.includes('pre-pe.com')) {
                    response.header('Access-Control-Allow-Origin', origin);
                    response.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                    response.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
                    response.header('Access-Control-Allow-Credentials', 'true');
                }
            }

            response.status(status).json({
                success: false,
                statusCode: status,
                message: message,
                error: exception?.name || 'Error',
                path: request.url,
                timestamp: new Date().toISOString(),
                ...(status === 500 && { stack: exception?.stack })
            });
        }
    })());

    const port = process.env.PORT ?? 3000;
    console.log('--------------------------------------------------');
    console.log(`🚀 [BOOTSTRAP] PRE-PE BACKEND STARTING...`);
    console.log(`📡 [BOOTSTRAP] Port: ${port}`);
    console.log(`🌍 [BOOTSTRAP] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log('--------------------------------------------------');
    
    try {
        await app.listen(port, '0.0.0.0');
        console.log(`✅ [BOOTSTRAP] Server successfully started and listening on ${port}`);
        console.log(`🔗 [BOOTSTRAP] Health Check: http://localhost:${port}/api/health`);
    } catch (err: any) {
        console.error(`❌ [BOOTSTRAP] CRITICAL: Failed to start server: ${err.message}`);
        if (err.code === 'EADDRINUSE') {
            console.error(`💡 [TIP] Port ${port} is already in use. Try killing the existing process.`);
        }
        process.exit(1);
    }
}
bootstrap();
