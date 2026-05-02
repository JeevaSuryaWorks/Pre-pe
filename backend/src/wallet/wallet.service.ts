import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
    private razorpay: any;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        });
    }

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

    async createRazorpayOrder(userId: string, amount: number) {
        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        try {
            const order = await this.razorpay.orders.create(options);
            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: this.configService.get<string>('RAZORPAY_KEY_ID')
            };
        } catch (error) {
            throw new BadRequestException('Failed to create Razorpay order');
        }
    }

    async verifyRazorpayPayment(userId: string, data: any) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = data;
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET')!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified, credit wallet
            await this.credit(userId, amount, `Razorpay Top-up: ${razorpay_payment_id}`);
            return { success: true, message: 'Payment verified and wallet credited' };
        } else {
            throw new BadRequestException('Invalid signature');
        }
    }
}