import { Controller, Get, Post, Body, UseGuards, Request, Req, Query, Headers, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

// Dummy comment to trigger TS refresh
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @UseGuards(SupabaseAuthGuard)
    @Get()
    async getBalance(@Request() req: any) {
        return this.walletService.getBalance(req.user.sub);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post('upi-intent')
    async createUpiIntent(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.createUpiIntent(req.user.sub, body.amount);
    }

    @UseGuards(SupabaseAuthGuard)
    @Get('payment-status')
    async getPaymentStatus(@Request() req: any, @Query('reference_id') referenceId: string) {
        return this.walletService.getPaymentStatus(req.user.sub, referenceId);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post('mark-failed')
    async markUpiIntentFailed(@Request() req: any, @Body() body: { reference_id: string, reason: string }) {
        return this.walletService.markUpiIntentFailed(req.user.sub, body.reference_id, body.reason);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post('create-order')
    async createOrder(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.createRazorpayOrder(req.user.sub, body.amount);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post('verify-razorpay')
    async verifyRazorpay(@Request() req: any, @Body() body: any) {
        return this.walletService.verifyRazorpayPayment(req.user.sub, body);
    }

    /**
     * RAZORPAY WEBHOOK (Public Endpoint)
     */
    @Post('webhook/razorpay')
    async handleRazorpayWebhook(
        @Req() req: RawBodyRequest<any>,
        @Body() body: any,
        @Headers('x-razorpay-signature') signature: string
    ) {
        return this.walletService.handleRazorpayWebhook(req.rawBody, body, signature);
    }

    @Post('credit')
    async credit(@Body() body: { userId: string, amount: number, ref?: string }) {
        return this.walletService.credit(body.userId, body.amount, body.ref);
    }
}
