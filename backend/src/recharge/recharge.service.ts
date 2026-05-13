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
    this.logger.log(`[RECHARGE:INIT] User: ${userId}, Amount: ${amount}, Mobile: ${mobileNumber}`);

    if (!this.isValidUuid(userId)) {
      this.logger.error(`[RECHARGE:VALIDATION_FAILED] Invalid User UUID: ${userId}`);
      throw new BadRequestException('Invalid user ID format');
    }

    if (!amount || amount <= 0)
      throw new BadRequestException('Invalid amount');

    const referenceId = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`.substring(0, 18);

    try {
      // ✅ WALLET CHECK
      this.logger.log(`[RECHARGE:DB_CHECK] Fetching wallet for ${userId}`);
      const wallet = await this.prisma.wallets.findUnique({
        where: { user_id: userId },
      });

      if (!wallet) {
        this.logger.error(`[RECHARGE:ERROR] Wallet not found for user: ${userId}`);
        throw new BadRequestException('Wallet not found');
      }

      if (Number(wallet.balance) < Number(amount)) {
        this.logger.warn(`[RECHARGE:INSUFFICIENT] User: ${userId}, Balance: ${wallet.balance}, Required: ${amount}`);
        throw new BadRequestException('Insufficient balance');
      }

      // ✅ DEBIT
      this.logger.log(`[RECHARGE:DEBIT] Debiting ₹${amount} from ${userId}`);
      await this.walletService.debit(userId, amount, `Recharge: ${mobileNumber} (${referenceId})`);

      // ✅ TRANSACTION RECORD
      this.logger.log(`[RECHARGE:TX_CREATE] Reference: ${referenceId}`);
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
      this.logger.log(`[RECHARGE:API_CALL] Calling KwikAPI for ${mobileNumber} (Ref: ${referenceId})`);
      const result: any = await this.callKwikApiDirectly(
        amount,
        mobileNumber,
        operator,
        referenceId,
      );

      this.logger.log(`[RECHARGE:API_RESULT] Result: ${JSON.stringify(result)}`);

      if (result.success) {
        const isPending = result.message?.toLowerCase().includes('pending') || false;
        
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: { 
            status: isPending ? 'PENDING' : 'SUCCESS',
            updated_at: new Date()
          },
        });

        this.logger.log(`[RECHARGE:SUCCESS] Completed for ${mobileNumber}`);
        return {
          success: true,
          status: isPending ? 'PENDING' : 'SUCCESS',
          message: result.message || 'Recharge processed',
          transaction_id: transaction.id,
        };
      } else {
        // ✅ AUTO-REFUND ONLY ON FAILURE
        this.logger.warn(`[RECHARGE:API_FAILED] Refunding ${userId} due to: ${result.message}`);
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
      this.logger.error(`[RECHARGE:CRITICAL] Failure: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Recharge failed: ${error.message}`);
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50, serviceType?: string) {
    if (!this.isValidUuid(userId)) return [];
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
    if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid user ID');
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
        }),
        // @ts-ignore
        signal: AbortSignal.timeout(15000) // 15s timeout
      });
      return await response.json();
    } catch (error: any) {
      throw new BadRequestException('Failed to fetch bill: ' + error.message);
    }
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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

    // ✅ OPERATOR MAPPING
    const operatorMap: Record<string, string> = {
      '1': '1',   // Airtel
      '2': '2',   // BSNL
      '3': '12',  // Jio
      '4': '3',   // VI
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
      family: 4, 
      timeout: 15000, // 15 seconds timeout
    };

    this.logger.log(`[KwikAPI:REQ] Calling: https://www.kwikapi.com/api/v2/recharge.php?order_id=${orderId}`);

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          this.logger.log(`[KwikAPI:RES] Raw for ${orderId}: ${data}`);
          try {
            const parsed = JSON.parse(data);
            if (parsed.status === 'SUCCESS' || parsed.status === 'PENDING') {
              resolve({ success: true, message: parsed.message || parsed.status });
            } else {
              resolve({ success: false, message: parsed.message || 'Operator failed' });
            }
          } catch (e) {
            this.logger.error(`[KwikAPI:PARSE_ERROR] Failed for ${orderId}: ${data}`);
            if (data.toLowerCase().includes('success') || data.toLowerCase().includes('pending')) {
                resolve({ success: true, message: 'PENDING (Parse error)' });
            } else {
                resolve({ success: false, message: 'Invalid provider response' });
            }
          }
        });
      });

      req.on('timeout', () => {
        this.logger.error(`[KwikAPI:TIMEOUT] Request timed out for ${orderId}`);
        req.destroy();
        resolve({ success: true, message: 'PENDING (Timeout)' });
      });

      req.on('error', (err) => {
        this.logger.error(`[KwikAPI:NET_ERROR] ${err.message} for ${orderId}`);
        resolve({ success: false, message: `Network error: ${err.message}` });
      });

      req.end();
    });
  }
}