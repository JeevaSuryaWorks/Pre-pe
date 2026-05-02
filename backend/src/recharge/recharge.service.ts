import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) { }

  async initiateRecharge(
    userId: string,
    amount: number,
    mobileNumber: string,
    operator: string,
  ) {
    // 🔥 VALIDATION
    if (!userId) throw new BadRequestException('Invalid user');
    if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

    const referenceId = `RECHARGE_${Date.now()}`;

    // 🔥 STEP 1: DEBIT WALLET
    await this.walletService.debit(userId, amount, referenceId);

    // 🔥 STEP 2: CREATE TRANSACTION
    const transaction = await this.prisma.transactions.create({
      data: {
        user_id: userId,
        amount,
        mobile_number: mobileNumber,
        operator_id: operator,
        status: 'PENDING',
        type: 'DEBIT',
        service_type: 'RECHARGE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 🔥 STEP 3: CALL API
    const result = await this.callKwikApi(
      amount,
      mobileNumber,
      operator,
      transaction.id,
    );

    // 🔥 STEP 4: UPDATE STATUS
    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? 'SUCCESS' : 'FAILED',
        updated_at: new Date(),
      },
    });

    // 🔥 STEP 5: REFUND IF FAILED
    if (!result.success) {
      await this.walletService.credit(
        userId,
        amount,
        `REFUND_${transaction.id}`,
      );
    }

    return {
      success: result.success,
      message: result.message,
      transaction_id: transaction.id,
    };
  }

  private async callKwikApi(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ) {
    try {
      const response = await fetch(
        'http://127.0.0.1:3000/api/kwik-proxy',
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

      if (data.status === 'SUCCESS' || data.status === 'PENDING') {
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}