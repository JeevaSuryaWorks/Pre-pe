import { Controller, Get, Logger } from '@nestjs/common';

@Controller('network')
export class NetworkController {
    private readonly logger = new Logger(NetworkController.name);

    @Get('ip')
    async getPublicIP() {
        try {
            let ip = "0.0.0.0";
            try {
                const response = await fetch('https://www.kwikapi.com/api/v2/ip_detect.php', {
                    // @ts-ignore
                    signal: AbortSignal.timeout(5000)
                });
                const data: any = await response.json();
                if (data.success && data.your_ip) {
                    ip = data.your_ip;
                } else {
                    throw new Error("KwikAPI response unsuccessful");
                }
            } catch (err) {
                this.logger.warn(`Failed to fetch IP from KwikAPI, trying ipify: ${err.message}`);
                const fallbackResponse = await fetch('https://api.ipify.org?format=json');
                const fallbackData: any = await fallbackResponse.json();
                ip = fallbackData.ip;
            }

            return {
                message: "KwikAPI / Outbound Network Info",
                outbound_ip: ip,
                proxy_configured: true,
                proxy_active: true,
                vercel_region: "KwikAPI (Detected)",
                instruction: "This IP is what KwikAPI sees and must be whitelisted in your KwikAPI portal."
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
