import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recharge')
@UseGuards(JwtAuthGuard)
export class RechargeController {
    constructor(private readonly rechargeService: RechargeService) { }


    @Post()
    async recharge(@Request() req: any, @Body() body: { amount: number, mobile: string, operator: string }) {
        return this.rechargeService.initiateRecharge(req.user.id, body.amount, body.mobile, body.operator);
    }
}
