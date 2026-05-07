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
} from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('recharge')
export class RechargeController {
    private readonly logger = new Logger(RechargeController.name);

    constructor(private readonly rechargeService: RechargeService) { }

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
                body.mobile_number,
                body.operator_id,
                body.circle_id,
                body.plan_id,
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
    @Post('fetch-bill')
    async fetchBill(@Req() req: any, @Body() body: { operator_id: string, number: string, user_id: string }) {
        return this.rechargeService.fetchBillDetails(body.operator_id, body.number, body.user_id);
    }
}