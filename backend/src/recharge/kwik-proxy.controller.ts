import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Controller('kwik-proxy')
export class KwikProxyController {
    private readonly logger = new Logger(KwikProxyController.name);

    constructor(private configService: ConfigService) { }

    @Post()
    async handleProxy(@Body() body: any) {
        const { endpoint, params = {}, method = 'GET' } = body || {};

        if (!endpoint) {
            throw new HttpException('Missing endpoint', HttpStatus.BAD_REQUEST);
        }

        const apiKey = this.configService.get<string>('KWIK_API_KEY');

        const query = new URLSearchParams({
            api_key: apiKey!,
            ...params,
        }).toString();

        const url =
            method === 'GET'
                ? `https://www.kwikapi.com/api/v2${endpoint}?${query}`
                : `https://www.kwikapi.com/api/v2${endpoint}`;

        const options: https.RequestOptions = {
            hostname: 'www.kwikapi.com',
            port: 443,
            path:
                method === 'GET'
                    ? `/api/v2${endpoint}?${query}`
                    : `/api/v2${endpoint}`,
            method,
            family: 4,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    this.logger.log(`Kwik Raw Response: ${data}`);

                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve({ raw: data });
                    }
                });
            });

            req.on('error', (err) => reject(err));

            if (method === 'POST') req.write(query);

            req.end();
        });
    }
}