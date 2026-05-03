import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    BadRequestException,
} from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('recharge')
export class RechargeController {
    constructor(private readonly rechargeService: RechargeService) { }

    @UseGuards(SupabaseAuthGuard)
    @Post()
    async recharge(@Req() req: any, @Body() body: any) {
        const userId = req.user?.sub;

        if (!userId) {
            throw new BadRequestException('Invalid user');
        }

        return this.rechargeService.initiateRecharge(
            userId,
            Number(body.amount),
            body.mobile_number,
            body.operator_id,
            body.circle_id,
            body.plan_id,
        );
    }
}