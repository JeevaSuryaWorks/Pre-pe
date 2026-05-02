import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async getBalance(userId: string) {
        const wallet = await this.prisma.$transaction(async (tx) => {
            return this.getOrCreateWallet(tx, userId);
        });
        return {
            balance: Number(wallet.balance),
            locked_balance: Number(wallet.locked_balance),
            available_balance: Number(wallet.balance) - Number(wallet.locked_balance),
        };
    }

    // 🔥 ALWAYS ensure wallet exists
    async getOrCreateWallet(tx: any, userId: string) {
        let wallet = await tx.wallets.findUnique({
            where: { user_id: userId },
        });

        if (!wallet) {
            wallet = await tx.wallets.create({
                data: {
                    user_id: userId,
                    balance: new Decimal(0),
                    locked_balance: new Decimal(0),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        return wallet;
    }

    async debit(userId: string, amount: number, description?: string) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await this.getOrCreateWallet(tx, userId);

            if (new Decimal(wallet.balance).lessThan(amount)) {
                throw new BadRequestException('Insufficient balance');
            }

            const updatedWallet = await tx.wallets.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    updated_at: new Date(),
                },
            });

            await tx.wallet_ledger.create({
                data: {
                    wallet_id: wallet.id,
                    type: 'DEBIT',
                    amount: new Decimal(amount),
                    balance_after: updatedWallet.balance,
                    description: description || 'Debit',
                    created_at: new Date(),
                },
            });

            return updatedWallet;
        });
    }

    async credit(userId: string, amount: number, description?: string) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await this.getOrCreateWallet(tx, userId);

            const updatedWallet = await tx.wallets.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    updated_at: new Date(),
                },
            });

            await tx.wallet_ledger.create({
                data: {
                    wallet_id: wallet.id,
                    type: 'CREDIT',
                    amount: new Decimal(amount),
                    balance_after: updatedWallet.balance,
                    description: description || 'Credit',
                    created_at: new Date(),
                },
            });

            return updatedWallet;
        });
    }

    async createUpiIntent(userId: string, amount: number) {
        // TODO: Implement actual UPI gateway integration
        return {
            success: true,
            intent_url: `upi://pay?pa=test@upi&pn=PrePe&am=${amount}&tr=TXN${Date.now()}`,
            reference_id: `REF${Date.now()}`
        };
    }

    async verifyUpiPayment(userId: string, upiRef: string) {
        // TODO: Implement actual verification with gateway
        return { success: true, message: 'Payment verified' };
    }

    async verifyAndSubscribe(userId: string, data: any) {
        // TODO: Implement actual subscription logic
        return { success: true, message: 'Subscribed successfully' };
    }
}