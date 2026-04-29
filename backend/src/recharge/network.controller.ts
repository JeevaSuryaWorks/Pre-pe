import { Controller, Get, Logger } from '@nestjs/common';

@Controller('network')
export class NetworkController {
    private readonly logger = new Logger(NetworkController.name);

    @Get('ip')
    async getPublicIP() {
        try {
            // Fetch public IP from an external service
            const response = await fetch('https://api.ipify.org?format=json');
            const data: any = await response.json();
            const ip = data.ip;

            return {
                message: "DigitalOcean Outbound Network Info",
                outbound_ip: ip,
                proxy_configured: true,
                proxy_active: true,
                vercel_region: "DigitalOcean (Static)",
                instruction: "This IP is static and should be whitelisted in KwikAPI."
            };
        } catch (error) {
            this.logger.error(`Failed to fetch public IP: ${error.message}`);
            return {
                message: "Error fetching network info",
                outbound_ip: "0.0.0.0",
                proxy_configured: false,
                proxy_active: false,
                vercel_region: "Unknown",
                instruction: "Check backend logs."
            };
        }
    }
}
