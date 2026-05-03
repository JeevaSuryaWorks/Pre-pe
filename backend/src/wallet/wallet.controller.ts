import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('wallet')
@UseGuards(SupabaseAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get()
    async getBalance(@Request() req: any) {
        return this.walletService.getBalance(req.user.sub);
    }

    @Post('upi-intent')
    async createUpiIntent(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.createUpiIntent(req.user.sub, body.amount);
    }

    @Get('payment-status')
    async getPaymentStatus(@Query('reference_id') referenceId: string) {
        return this.walletService.getPaymentStatus(referenceId);
    }

    @Post('create-order')
    async createOrder(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.createRazorpayOrder(req.user.sub, body.amount);
    }

    @Post('verify-razorpay')
    async verifyRazorpay(@Request() req: any, @Body() body: any) {
        return this.walletService.verifyRazorpayPayment(req.user.sub, body);
    }

    // Keep for admin/system use
    @Post('credit')
    async credit(@Body() body: { userId: string, amount: number, ref?: string }) {
        return this.walletService.credit(body.userId, body.amount, body.ref);
    }
}
