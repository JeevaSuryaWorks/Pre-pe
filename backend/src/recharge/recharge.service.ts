import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RechargeStatus } from '../prisma/prisma.service';

@Injectable()
export class RechargeService {
    private readonly logger = new Logger(RechargeService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private configService: ConfigService,
    ) { }

    async initiateRecharge(userId: string, amount: number, mobileNumber: string, operator: string) {
        const referenceId = `RECHARGE_${Date.now()}_${mobileNumber}`;

        try {
            await this.walletService.debit(userId, amount, referenceId);
        } catch (e) {
            throw new BadRequestException('Insufficient balance or wallet error');
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

        this.callKwikApi(amount, mobileNumber, operator, transaction.id).then(async (success) => {
            const status = success ? RechargeStatus.SUCCESS : RechargeStatus.FAILED;
            
            await this.prisma.transactions.update({
                where: { id: transaction.id },
                data: { status }
            });

            if (status === RechargeStatus.FAILED) {
                await this.walletService.credit(userId, amount, `REFUND_${transaction.id}`);
            }
        });

        return transaction;
    }

    private async callKwikApi(amount: number, mobileNumber: string, operator: string, orderId: string): Promise<boolean> {
        const apiKey = this.configService.get<string>('KWIK_API_KEY');
        const baseUrl = this.configService.get<string>('KWIK_API_BASE_URL') || 'https://www.kwikapi.com/api/v2';
        
        try {
            const params = new URLSearchParams({
                api_key: apiKey,
                number: mobileNumber,
                amount: amount.toString(),
                opid: operator,
                order_id: orderId,
            });

            this.logger.log(`Initiating recharge via KwikAPI for ${mobileNumber}`);
            const response = await fetch(`${baseUrl}/recharge.php?${params.toString()}`);
            const data = await response.json();
            
            this.logger.debug(`KwikAPI Response: ${JSON.stringify(data)}`);
            return data.status === 'SUCCESS';
        } catch (error) {
            this.logger.error(`KwikAPI call failed: ${error.message}`);
            return false;
        }
    }
}
