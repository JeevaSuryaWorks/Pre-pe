import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RechargeStatus } from '../prisma/prisma.service';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async initiateRecharge(
    userId: string,
    amount: number,
    mobileNumber: string,
    operator: string,
  ) {
    const referenceId = `RECHARGE_${Date.now()}_${mobileNumber}`;

    try {
      await this.walletService.debit(userId, amount, referenceId);
    } catch {
      throw new BadRequestException(
        'Insufficient balance or wallet error',
      );
    }

    const transaction = await this.prisma.transactions.create({
      data: {
        user_id: userId,
        amount,
        mobile_number: mobileNumber,
        operator_id: operator,
        status: RechargeStatus.PENDING,
        type: 'DEBIT',
        service_type: 'RECHARGE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const orderId =
      Date.now().toString().slice(-12) +
      Math.floor(Math.random() * 999)
        .toString()
        .padStart(3, '0');

    const result = await this.callKwikApi(
      amount,
      mobileNumber,
      operator,
      orderId,
    );

    const finalStatus = result.success
      ? RechargeStatus.SUCCESS
      : RechargeStatus.FAILED;

    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: finalStatus,
        updated_at: new Date(),
      },
    });

    if (!result.success) {
      await this.walletService.credit(
        userId,
        amount,
        `REFUND_${transaction.id}`,
      );
    }

    return {
      success: result.success,
      status: result.success ? 'SUCCESS' : 'FAILED',
      message: result.message,
      transaction_id: transaction.id,
      detail: result.raw,
    };
  }

  private async callKwikApi(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ): Promise<any> {
    try {
      const response = await fetch(
        'http://127.0.0.1:3000/api/kwik-proxy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

      const text = await response.text();
      this.logger.log(`Kwik Response: ${text}`);

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          message: 'Invalid provider response',
          raw: text,
        };
      }

      if (
        data.status === 'SUCCESS' ||
        data.status === 'PENDING'
      ) {
        return {
          success: true,
          message: data.message || 'Recharge successful',
          raw: data,
        };
      }

      return {
        success: false,
        message: data.message || 'Recharge failed',
        raw: data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        raw: {},
      };
    }
  }
}