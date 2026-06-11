import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    BadRequestException,
    Get,
    Query,
    Logger,
    Param,
} from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('recharge')
export class RechargeController {
    private readonly logger = new Logger(RechargeController.name);

    constructor(private readonly rechargeService: RechargeService) { 
        this.logger.log('RechargeController initialized');
    }

    @Get('test')
    async test() {
        // Try to get outbound IP for whitelisting verification
        let outboundIp = 'Unknown';
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            const data: any = await resp.json();
            outboundIp = data.ip;
        } catch (e) {
            // Silently ignore IP fetch failure for test endpoint
        }

        return { 
            message: 'Recharge controller is alive',
            version: '1.1.0-PROD-RECHARGE',
            timestamp: new Date().toISOString(),
            status: 'OK',
            outbound_ip: outboundIp,
            node_version: process.version,
            env: process.env.NODE_ENV || 'production'
        };
    }

    @Get('health')
    health() {
        return { status: 'healthy', service: 'recharge-service', uptime: process.uptime() };
    }

    @UseGuards(SupabaseAuthGuard)
    @Post()
    async recharge(@Req() req: any, @Body() body: any) {
        const userId = req.user?.sub;

        if (!userId) {
            this.logger.error('Recharge attempt without userId');
            throw new BadRequestException('Invalid user');
        }

        this.logger.log(`Incoming recharge request for user: ${userId}`);
        
        try {
            return await this.rechargeService.initiateRecharge(
                userId,
                Number(body.amount),
                body.mobile_number || body.dth_id,
                body.operator_id,
                body.circle_id,
                body.plan_id,
                body.dth_id,
            );
        } catch (error: any) {
            this.logger.error(`Recharge controller error: ${error.message}`);
            throw error;
        }
    }

    @UseGuards(SupabaseAuthGuard)
    @Get('history')
    async getHistory(@Req() req: any, @Query('limit') limit: number, @Query('service_type') serviceType: string) {
        const userId = req.user?.sub;
        return this.rechargeService.getTransactionHistory(userId, limit, serviceType);
    }

    @UseGuards(SupabaseAuthGuard)
    @Get('status/:id')
    async getStatus(@Req() req: any, @Param('id') id: string) {
        const userId = req.user?.sub;
        if (!userId) {
            throw new BadRequestException('Invalid user');
        }
        return this.rechargeService.checkStatus(userId, id);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post('fetch-bill')
    async fetchBill(@Req() req: any, @Body() body: { operator_id: string, number: string, user_id: string }) {
        return this.rechargeService.fetchBillDetails(body.operator_id, body.number, body.user_id);
    }
}