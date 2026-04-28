import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import https from 'https';

@Controller('kwik-proxy')
export class KwikProxyController {
    private readonly logger = new Logger(KwikProxyController.name);

    private readonly agent = new https.Agent({
        keepAlive: true,
        family: 4,
    });

    constructor(private configService: ConfigService) { }

    @Post()
    async handleProxy(@Body() body: any = {}) {
        try {
            const endpoint = body?.endpoint;
            const params = body?.params || {};
            const method = body?.method || 'GET';

            if (!endpoint) {
                throw new HttpException(
                    'Missing endpoint',
                    HttpStatus.BAD_REQUEST,
                );
            }

            const kwikApiKey =
                this.configService.get<string>('KWIK_API_KEY');

            if (!kwikApiKey) {
                throw new HttpException(
                    'Missing API Key',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            let url = `https://www.kwikapi.com/api/v2${endpoint}`;

            const search = new URLSearchParams();
            search.append('api_key', kwikApiKey);

            for (const [k, v] of Object.entries(params)) {
                if (v !== undefined && v !== null) {
                    search.append(k, String(v));
                }
            }

            url += `?${search.toString()}`;

            this.logger.log(`Calling: ${url}`);

            const res = await fetch(url, {
                method,
                agent: this.agent as any,
            } as any);

            const text = await res.text();

            this.logger.log(`Kwik Response: ${text}`);

            try {
                return JSON.parse(text);
            } catch {
                return { raw: text };
            }
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }
}