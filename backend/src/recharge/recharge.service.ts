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
  ) { }

  async initiateRecharge(
    userId: string,
    amount: number,
    mobileNumber: string,
    operator: string,
    circleId?: string,
    planId?: string,
  ) {
    this.logger.log(`Recharge request for user: ${userId}`);

    if (!userId) throw new BadRequestException('User not found');
    if (!amount || amount <= 0)
      throw new BadRequestException('Invalid amount');

    const referenceId = `REC_${Date.now()}`;

    // ✅ WALLET CHECK
    const wallet = await this.prisma.wallets.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (Number(wallet.balance) < Number(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // ✅ DEBIT
    await this.walletService.debit(userId, amount, referenceId);

    // ✅ TRANSACTION
    const transaction = await this.prisma.transactions.create({
      data: {
        user_id: userId,
        type: 'DEBIT',
        service_type: 'RECHARGE',
        amount,
        mobile_number: mobileNumber,
        operator_id: operator,
        circle_id: circleId,
        plan_id: planId,
        status: 'PENDING',
        reference_id: referenceId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // ✅ API CALL
    const result = await this.callKwikApi(
      amount,
      mobileNumber,
      operator,
      referenceId,
    );

    // ✅ REFUND IF FAILED
    if (!result.success) {
      await this.walletService.credit(
        userId,
        amount,
        `REFUND_${referenceId}`,
      );
    }

    // ✅ UPDATE STATUS
    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? 'SUCCESS' : 'FAILED',
        updated_at: new Date(),
      },
    });

    return {
      success: result.success,
      status: result.success ? 'SUCCESS' : 'FAILED',
      message: result.message,
      transaction_id: transaction.id,
    };
  }

  async getTransactionHistory(userId: string, limit: number = 50, serviceType?: string) {
    return this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        ...(serviceType && { 
            service_type: serviceType === 'MOBILE_PREPAID' ? 'RECHARGE' : serviceType 
        }),
      },
      take: Number(limit),
      orderBy: { created_at: 'desc' },
    });
  }

  async fetchBillDetails(operatorId: string, number: string, userId: string) {
    const port = this.configService.get<string>('PORT') || '3000';
    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/kwik-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: '/fetch_bill.php',
                method: 'GET',
                params: {
                    opid: operatorId,
                    number: number
                }
            })
        });
        return await response.json();
    } catch (error: any) {
        throw new BadRequestException('Failed to fetch bill: ' + error.message);
    }
  }

  private async callKwikApi(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ) {
    const port = this.configService.get<string>('PORT') || '3000';

    try {
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

      if (data.status === 'SUCCESS' || data.status === 'PENDING') {
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}