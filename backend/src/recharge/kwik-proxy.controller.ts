import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('kwik-proxy')
export class KwikProxyController {
    @Post()
    async handleProxy(@Body() body: { endpoint: string, params?: Record<string, any>, method?: 'GET' | 'POST' }) {
        const { endpoint, params, method = 'GET' } = body;

        if (!endpoint) {
            throw new HttpException('Missing endpoint', HttpStatus.BAD_REQUEST);
        }

        const kwikApiKey = process.env.KWIK_API_KEY;
        if (!kwikApiKey) {
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

            const apiRes = await fetch(url, options);
            const text = await apiRes.text();
            
            try {
                return JSON.parse(text);
            } catch (e) {
                return { error: 'Parse Error', raw: text };
            }
        } catch (error) {
            console.error('KWIK Proxy Controller Error:', error);
            throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
