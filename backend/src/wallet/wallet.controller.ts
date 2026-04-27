import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get()
    async getBalance(@Request() req: any) {
        return this.walletService.getBalance(req.user.id);
    }

    @Post('upi/create-intent')
    async createUpiIntent(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.createUpiIntent(req.user.id, body.amount);
    }

    @Post('upi/verify')
    async verifyUpi(@Request() req: any, @Body() body: { upiRef: string }) {
        return this.walletService.verifyUpiPayment(req.user.id, body.upiRef);
    }

    @Post('subscribe-plan')
    async subscribePlan(@Request() req: any, @Body() body: any) {
        return this.walletService.verifyAndSubscribe(req.user.id, {
            razorpay_order_id: body.razorpay_order_id,
            razorpay_payment_id: body.razorpay_payment_id,
            razorpay_signature: body.razorpay_signature,
            plan_name: body.plan_name
        });
    }

    // Admin only in real app, but exposed for demo
    @Post('credit')
    async credit(@Body() body: { userId: string, amount: number, ref?: string }) {
        return this.walletService.credit(body.userId, body.amount, body.ref);
    }
}
