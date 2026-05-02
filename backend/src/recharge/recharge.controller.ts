import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common'
import { RechargeService } from './recharge.service'
import { SupabaseAuthGuard } from '../auth/supabase.guard'

@Controller('recharge')
export class RechargeController {
    constructor(private readonly rechargeService: RechargeService) { }

    @UseGuards(SupabaseAuthGuard)
    @Post()
    async recharge(
        @Req() req: any,
        @Body() body: any,
    ) {
        const userId = req.user.sub // ✅ CRITICAL FIX

        return this.rechargeService.initiateRecharge(
            userId,
            body.amount,
            body.mobile,
            body.operator,
        )
    }
}