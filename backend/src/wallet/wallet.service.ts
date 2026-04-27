import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
    private razorpay: Razorpay;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        });
    }

    async getBalance(userId: string) {
        const wallet = await this.prisma.wallets.findFirst({
            where: { user_id: userId },
        });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return wallet;
    }

    // UPI Intent for Wallet Top-up
    async createUpiIntent(userId: string, amount: number) {
        const upiHandle = this.configService.get<string>('UPI_VPA') || 'merchant@upi';
        const merchantName = 'Pre-pe';
        const upiRef = `TXN${Date.now()}`;

        const txn = await this.prisma.upi_transactions.create({
            data: {
                user_id: userId,
                amount: new Decimal(amount),
                upi_ref_id: upiRef,
                gateway_status: 'PENDING',
                created_at: new Date(),
                updated_at: new Date(),
            }
        });

        const upiUrl = `upi://pay?pa=${upiHandle}&pn=${encodeURIComponent(merchantName)}&tr=${upiRef}&am=${amount}&cu=INR`;

        return {
            intentUrl: upiUrl,
            upiRef: upiRef,
            transactionId: txn.id,
            qrCode: upiUrl
        };
    }

    async verifyUpiPayment(userId: string, upiRef: string) {
        // In a real app, you'd check with your bank/gateway API here.
        // For now, we simulate a success check.
        const txn = await this.prisma.upi_transactions.findFirst({
            where: { upi_ref_id: upiRef, user_id: userId }
        });

        if (!txn) throw new NotFoundException('Transaction not found');
        if (txn.gateway_status === 'SUCCESS') return { status: 'SUCCESS' };

        // Process credit
        await this.prisma.upi_transactions.update({
            where: { id: txn.id },
            data: { gateway_status: 'SUCCESS', updated_at: new Date() }
        });

        return await this.credit(userId, Number(txn.amount), `UPI Topup: ${upiRef}`);
    }


    async verifyAndSubscribe(userId: string, paymentDetails: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        plan_name: string;
    }) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_name } = paymentDetails;

        const generated_signature = crypto
            .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET'))
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Update profile plan_type
        return await this.prisma.profiles.update({
            where: { user_id: userId },
            data: {
                plan_type: plan_name,
                updated_at: new Date(),
            },
        });
    }

    async credit(userId: string, amount: number, description?: string) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallets.findFirst({ where: { user_id: userId } });
            if (!wallet) throw new NotFoundException('Wallet not found');

            const updatedWallet = await tx.wallets.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    updated_at: new Date(),
                },
            });

            const ledger = await tx.wallet_ledger.create({
                data: {
                    wallet_id: wallet.id,
                    amount: new Decimal(amount),
                    type: 'CREDIT',
                    description: description || 'Credit',
                    balance_after: updatedWallet.balance,
                    created_at: new Date(),
                },
            });

            return { wallet: updatedWallet, transaction: ledger };
        });
    }

    async debit(userId: string, amount: number, description?: string) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallets.findFirst({ where: { user_id: userId } });
            if (!wallet) throw new NotFoundException('Wallet not found');

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

            const ledger = await tx.wallet_ledger.create({
                data: {
                    wallet_id: wallet.id,
                    amount: new Decimal(amount),
                    type: 'DEBIT',
                    description: description || 'Debit',
                    balance_after: updatedWallet.balance,
                    created_at: new Date(),
                },
            });

            return { wallet: updatedWallet, transaction: ledger };
        });
    }
}
