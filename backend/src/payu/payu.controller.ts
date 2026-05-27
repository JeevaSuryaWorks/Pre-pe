import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PayuService } from './payu.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('payu/bnpl')
export class PayuController {
  constructor(private readonly payuService: PayuService) {}

  /**
   * Check customer eligibility for LazyPay
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('eligibility')
  async checkEligibility(
    @Request() req: any,
    @Body() body: { amount: number; phone: string }
  ) {
    return this.payuService.checkEligibility(body.amount, body.phone, req.user.sub);
  }

  /**
   * Initiate S2S BNPL transaction (Lending Borrow or Add Money)
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('initiate')
  async initiatePayment(
    @Request() req: any,
    @Body() body: { amount: number; phone: string; flow?: 'borrow' | 'topup' }
  ) {
    const flow = body.flow || 'borrow';
    return this.payuService.initiatePayment(body.amount, body.phone, req.user.sub, flow);
  }

  /**
   * Submit OTP to complete first-time linking and payment
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('submit-otp')
  async submitOtp(
    @Request() req: any,
    @Body() body: { referenceId: string; otp: string; amount: number }
  ) {
    return this.payuService.submitOtp(body.referenceId, body.otp, body.amount, req.user.sub);
  }

  /**
   * Fetch payment transaction status
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('status')
  async getPaymentStatus(
    @Request() req: any,
    @Query('referenceId') referenceId: string
  ) {
    return this.payuService.getPaymentStatus(referenceId, req.user.sub);
  }
}
