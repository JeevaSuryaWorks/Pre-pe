import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import * as https from 'https';

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
    this.logger.log(`[Recharge] Initiating request for user: ${userId}, amount: ${amount}, mobile: ${mobileNumber}`);

    if (!userId) throw new BadRequestException('User not found');
    if (!amount || amount <= 0)
      throw new BadRequestException('Invalid amount');

    const referenceId = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`.substring(0, 18);

    try {
      // ✅ WALLET CHECK
      const wallet = await this.prisma.wallets.findUnique({
        where: { user_id: userId },
      });

      if (!wallet) {
        this.logger.error(`[Recharge] Wallet not found for user: ${userId}`);
        throw new BadRequestException('Wallet not found');
      }

      // ✅ PROFILE CHECK (Important for relation)
      const profile = await this.prisma.profiles.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        this.logger.warn(`[Recharge] Profile not found for user: ${userId}. Syncing...`);
        try {
          // Attempt to create profile if it doesn't exist
          await this.prisma.profiles.upsert({
            where: { user_id: userId },
            create: {
              user_id: userId,
              created_at: new Date(),
              updated_at: new Date(),
            },
            update: {
              updated_at: new Date(),
            }
          });
          this.logger.log(`[Recharge] Profile successfully synced/upserted for user: ${userId}`);
        } catch (syncError: any) {
          this.logger.error(`[Recharge] Profile sync failed: ${syncError.message}`);
          // Continue anyway, as the wallet already exists
        }
      }

      if (Number(wallet.balance) < Number(amount)) {
        this.logger.warn(`[Recharge] Insufficient balance for user: ${userId}. Balance: ${wallet.balance}, Required: ${amount}`);
        throw new BadRequestException('Insufficient balance');
      }

      // ✅ DEBIT
      this.logger.log(`[Recharge] Debiting wallet for user: ${userId}, amount: ${amount}`);
      await this.walletService.debit(userId, amount, `Recharge: ${mobileNumber} (${referenceId})`);

      // ✅ TRANSACTION RECORD
      this.logger.log(`[Recharge] Creating transaction record: ${referenceId}`);
      const transaction = await this.prisma.transactions.create({
        data: {
          user_id: userId,
          type: 'RECHARGE',
          service_type: 'MOBILE_PREPAID',
          amount: new Decimal(amount),
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
      this.logger.log(`[Recharge] Calling KwikAPI for: ${mobileNumber}`);
      const result: any = await this.callKwikApiDirectly(
        amount,
        mobileNumber,
        operator,
        referenceId,
      );

      this.logger.log(`[Recharge] KwikAPI Result: ${JSON.stringify(result)}`);

      if (result.success) {
        // If SUCCESS or PENDING, keep money and update status
        const isPending = result.message?.toLowerCase().includes('pending') || false;
        
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: { 
            status: isPending ? 'PENDING' : 'SUCCESS',
            updated_at: new Date()
          },
        });

        return {
          success: true,
          status: isPending ? 'PENDING' : 'SUCCESS',
          message: result.message || 'Recharge processed',
          transaction_id: transaction.id,
        };
      } else {
        // ✅ AUTO-REFUND ONLY ON FAILURE
        this.logger.warn(`[Recharge] API Failed, refunding user: ${userId}`);
        await this.walletService.credit(
          userId,
          amount,
          `REFUND_${referenceId}: ${result.message || 'API Failure'}`,
        );

        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            updated_at: new Date(),
          },
        });

        return {
          success: false,
          status: 'FAILED',
          message: result.message,
          transaction_id: transaction.id,
        };
      }
    } catch (error: any) {
      this.logger.error(`[Recharge] Critical Failure: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Recharge failed: ${error.message}`);
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50, serviceType?: string) {
    return this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        ...(serviceType && {
          service_type: serviceType === 'RECHARGE' ? 'MOBILE_PREPAID' : serviceType
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

  private async callKwikApiDirectly(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ): Promise<{ success: boolean; message: string }> {
    const apiKey = this.configService.get<string>('KWIK_API_KEY');
    
    if (!apiKey) {
      this.logger.error('[KwikAPI] Missing KWIK_API_KEY in configuration');
      return { success: false, message: 'API Configuration missing' };
    }

    // ✅ OPERATOR MAPPING (Translate DB IDs to KwikAPI Codes)
    const operatorMap: Record<string, string> = {
      '1': '1',   // Airtel
      '2': '3',   // VI
      '3': '12',  // Jio
      '4': '2',   // BSNL
      '5': '10',  // Dish TV
      '6': '11',  // Tata Sky
    };

    const kwikOpId = operatorMap[operator] || operator;

    const query = new URLSearchParams({
      api_key: apiKey,
      number: mobileNumber,
      amount: amount.toString(),
      opid: kwikOpId,
      order_id: orderId,
    }).toString();

    const options: https.RequestOptions = {
      hostname: 'www.kwikapi.com',
      port: 443,
      path: `/api/v2/recharge.php?${query}`,
      method: 'GET',
      family: 4, // Force IPv4
    };

    this.logger.log(`[KwikAPI] Requesting: https://${options.hostname}${options.path}`);

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          this.logger.log(`[KwikAPI] Raw Response: ${data}`);
          try {
            const parsed = JSON.parse(data);
            if (parsed.status === 'SUCCESS' || parsed.status === 'PENDING') {
              resolve({ success: true, message: parsed.message || 'Processing' });
            } else {
              resolve({ success: false, message: parsed.message || 'Operator failed' });
            }
          } catch (e) {
            this.logger.error(`[KwikAPI] JSON Parse Error: ${data}`);
            resolve({ success: false, message: 'Invalid provider response' });
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`[KwikAPI] Network Error: ${err.message}`);
        resolve({ success: false, message: `Network error: ${err.message}` });
      });

      req.end();
    });
  }

  // Keep legacy method for compatibility if needed elsewhere, but mark as deprecated
  private async callKwikApi(
    amount: number,
    mobileNumber: string,
    operator: string,
    orderId: string,
  ) {
    return this.callKwikApiDirectly(amount, mobileNumber, operator, orderId);
  }
}