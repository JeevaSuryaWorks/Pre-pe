import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  async initiateRecharge(
    userId: string,
    amount: number,
    mobileNumber: string,
    operator: string,
    circleId?: string,
    planId?: string,
  ) {
    // 🔥 STEP 1: DEBIT WALLET FIRST
    if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

    const referenceId = `REC${Date.now()}`;

    try {
      await this.walletService.debit(userId, amount, referenceId);
    } catch (err) {
      throw new BadRequestException('Insufficient balance or wallet error');
    }

    // 🔥 STEP 2: LOG TRANSACTION
    const transaction = await this.prisma.transactions.create({
      data: {
        user_id: userId,
        amount,
        mobile_number: mobileNumber,
        operator_id: operator,
        circle_id: circleId,
        plan_id: planId,
        status: 'PENDING',
        type: 'DEBIT',
        service_type: 'RECHARGE',
        reference_id: referenceId,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    });

    // 🔥 STEP 3: CALL API
    const result = await this.callKwikApi(
      amount,
      mobileNumber,
      operator,
      referenceId,
    );

    if (!result.success) {
      await this.walletService.credit(userId, amount, `Refund: ${result.message}`);
    }

    // 🔥 STEP 4: UPDATE TRANSACTION
    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? 'SUCCESS' : 'FAILED',
        updated_at: new Date(),
      },
    });

    return {
      status: result.success ? 'SUCCESS' : 'FAILED',
      transaction_id: transaction.id,
      message: result.message,
    };
  }

  private async callKwikApi(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ) {
    const port = this.configService.get<string>('PORT') || '3000';
    try {
      console.log('Calling KwikAPI Proxy:', { amount, mobileNumber, operator, orderId });
      const response = await fetch(
        `http://127.0.0.1:${port}/api/kwik-proxy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: '/recharge.php',
            method: 'GET',
            params: {
              number: mobileNumber,
              amount: amount.toString(),
              opid: operator,
              order_id: orderId,
            },
          }),
        },
      );

      const data = await response.json();
      console.log('KwikAPI Proxy Response:', data);

      if (data.status === 'SUCCESS' || data.status === 'PENDING') {
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'KwikAPI error' };
    } catch (err: any) {
      console.error('KwikAPI Proxy Exception:', err.message);
      return { success: false, message: err.message };
    }
  }
}