import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import https from 'https';

@Controller('kwik-proxy')
export class KwikProxyController {
    private readonly logger = new Logger(KwikProxyController.name);
    private readonly agent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
    });

    constructor(private configService: ConfigService) { }

    @Post()
    async handleProxy(@Body() body: { endpoint: string, params?: Record<string, any>, method?: 'GET' | 'POST' }) {
        const { endpoint, params, method = 'GET' } = body;

        if (!endpoint) {
            throw new HttpException('Missing endpoint', HttpStatus.BAD_REQUEST);
        }

        const kwikApiKey = this.configService.get<string>('KWIK_API_KEY');
        if (!kwikApiKey) {
            this.logger.error('KWIK_API_KEY is not defined in environment variables');
            throw new HttpException('Server config error: Missing API Key', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            const baseUrl = 'https://www.kwikapi.com/api/v2';
            let url = `${baseUrl}${endpoint}`;
            let options: RequestInit = { method };

            if (method === 'GET') {
                const sp = new URLSearchParams();
                sp.append('api_key', kwikApiKey);
                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        if (v !== undefined && v !== null) sp.append(k, String(v));
                    }
                }
                url = `${url}${url.includes('?') ? '&' : '?'}${sp.toString()}`;
            } else if (method === 'POST') {
                const formData = new URLSearchParams();
                formData.append('api_key', kwikApiKey);
                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        if (v !== undefined && v !== null) formData.append(k, String(v));
                    }
                }
                options.body = formData;
                options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            }

            this.logger.log(`Forwarding ${method} request to KwikAPI: ${endpoint}`);
            const apiRes = await fetch(url, {
                ...options,
                agent: this.agent as any
            } as any);

            const text = await apiRes.text();

            // Log the raw response to catch any errors from KwikAPI (like IP not whitelisted)
            this.logger.debug(`KwikAPI Raw Response: ${text}`);

            try {
                return JSON.parse(text);
            } catch (e) {
                return { error: 'Parse Error', raw: text };
            }
        } catch (error) {
            this.logger.error('KWIK Proxy Controller Error:', error.message);
            throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
