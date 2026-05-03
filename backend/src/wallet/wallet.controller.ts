import { Controller, Get, Post, Body, UseGuards, Request, Query, Headers, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

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
    async getPaymentStatus(@Query('reference_id') referenceId: string) {
        return this.walletService.getPaymentStatus(referenceId);
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
        @Body() body: any,
        @Headers('x-razorpay-signature') signature: string
    ) {
        return this.walletService.handleRazorpayWebhook(body, signature);
    }

    @Post('credit')
    async credit(@Body() body: { userId: string, amount: number, ref?: string }) {
        return this.walletService.credit(body.userId, body.amount, body.ref);
    }
}
