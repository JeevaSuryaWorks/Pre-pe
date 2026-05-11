import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LoanService } from './loan.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';


@Controller('loans')
@UseGuards(SupabaseAuthGuard)
export class LoanController {
    constructor(private readonly loanService: LoanService) { }

    @Post('request')
    async requestLoan(@Request() req: any, @Body() body: { amount: number }) {
        return this.loanService.requestLoan(req.user.id, body.amount);
    }

    @Get('active')
    async getActiveLoans(@Request() req: any) {
        return this.loanService.getActiveLoans(req.user.id);
    }

    @Get('history')
    async getLoanHistory(@Request() req: any) {
        return this.loanService.getLoanHistory(req.user.id);
    }
}
