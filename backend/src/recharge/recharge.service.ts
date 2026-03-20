import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RechargeStatus } from '../prisma/prisma.service';

@Injectable()
export class RechargeService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
    ) { }

    async initiateRecharge(userId: string, amount: number, mobileNumber: string, operator: string) {
        // 1. Check & Debit Balance (Atomic)
        // We use a reference ID for the debit to ensure idempotency if needed
        const referenceId = `RECHARGE_${Date.now()}_${mobileNumber}`;

        try {
            await this.walletService.debit(userId, amount, referenceId);
        } catch (e) {
            throw new BadRequestException('Insufficient balance or wallet error');
        }

        // 2. Create Recharge Transaction (PENDING)
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

        // 3. Call Vendor API (KwikAPI)
        this.callKwikApi(amount, mobileNumber, operator, transaction.id).then(async (success) => {
            const status = success ? RechargeStatus.SUCCESS : RechargeStatus.FAILED;
            
            await this.prisma.transactions.update({
                where: { id: transaction.id },
                data: { status }
            });

            if (status === RechargeStatus.FAILED) {
                // Auto-refund
                await this.walletService.credit(userId, amount, `REFUND_${transaction.id}`);
            }
        });

        return transaction;
    }

    // Real KwikAPI call
    private async callKwikApi(amount: number, mobileNumber: string, operator: string, orderId: string): Promise<boolean> {
        const apiKey = process.env.KWIK_API_KEY;
        const baseUrl = process.env.KWIK_API_BASE_URL || 'https://www.kwikapi.com/api/v2';
        
        try {
            const params = new URLSearchParams({
                api_key: apiKey,
                number: mobileNumber,
                amount: amount.toString(),
                opid: operator, // Assuming operator is passed as ID
                order_id: orderId,
            });

            const response = await fetch(`${baseUrl}/recharge.php?${params.toString()}`);
            const data = await response.json();
            
            return data.status === 'SUCCESS';
        } catch (error) {
            console.error('KwikAPI call failed:', error);
            return false;
        }
    }
}
