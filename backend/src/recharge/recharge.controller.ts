import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('recharge')
@UseGuards(SupabaseAuthGuard)
export class RechargeController {
    constructor(private readonly rechargeService: RechargeService) { }


    @Post()
    async recharge(@Request() req: any, @Body() body: { amount: number, mobile: string, operator: string }) {
        return this.rechargeService.initiateRecharge(req.user.id, body.amount, body.mobile, body.operator);
    }
}
