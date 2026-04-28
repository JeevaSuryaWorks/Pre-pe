import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import https from 'https';

@Controller('kwik-proxy')
export class KwikProxyController {
    private readonly logger = new Logger(KwikProxyController.name);

    // FORCE IPv4
    private readonly agent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
        family: 4,
    });

    constructor(private configService: ConfigService) { }

    @Post()
    async handleProxy(
        @Body()
        body: {
            endpoint: string;
            params?: Record<string, any>;
            method?: 'GET' | 'POST';
        },
    ) {
        const { endpoint, params, method = 'GET' } = body;

        if (!endpoint) {
            throw new HttpException(
                'Missing endpoint',
                HttpStatus.BAD_REQUEST,
            );
        }

        const kwikApiKey =
            this.configService.get<string>('KWIK_API_KEY');

        if (!kwikApiKey) {
            this.logger.error('KWIK_API_KEY missing');
            throw new HttpException(
                'Missing API Key',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const baseUrl = 'https://www.kwikapi.com/api/v2';
            let url = `${baseUrl}${endpoint}`;

            const headers: any = {};
            let data: any = undefined;

            // GET REQUEST
            if (method === 'GET') {
                const sp = new URLSearchParams();
                sp.append('api_key', kwikApiKey);

                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        if (v !== undefined && v !== null) {
                            sp.append(k, String(v));
                        }
                    }
                }

                url += `${url.includes('?') ? '&' : '?'}${sp.toString()}`;
            }

            // POST REQUEST
            if (method === 'POST') {
                const formData = new URLSearchParams();
                formData.append('api_key', kwikApiKey);

                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        if (v !== undefined && v !== null) {
                            formData.append(k, String(v));
                        }
                    }
                }

                data = formData.toString();

                headers['Content-Type'] =
                    'application/x-www-form-urlencoded';
            }

            this.logger.log(
                `Sending ${method} request to KwikAPI: ${url}`,
            );

            const response = await axios({
                method: method.toLowerCase() as any,
                url,
                data,
                headers,
                httpsAgent: this.agent, // FORCE IPv4
                timeout: 30000,
            });

            this.logger.debug(
                `KwikAPI Response: ${JSON.stringify(response.data)}`,
            );

            return response.data;
        } catch (error: any) {
            this.logger.error(
                `KWIK Proxy Error: ${error.message}`,
            );

            if (error.response?.data) {
                return error.response.data;
            }

            throw new HttpException(
                error.message || 'Internal Server Error',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}