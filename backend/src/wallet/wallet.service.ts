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

    async createOrder(userId: string, amount: number) {
        // Enforce limits based on KYC
        // amount here is totalPayable (base + 2.5% charges)
        const baseAmount = Math.floor(amount / 1.025);

        const kycRecord = await this.prisma.kyc_verifications.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });

        const status = kycRecord?.status || null;
        const limit = status === 'APPROVED' ? 5000 : 2000;

        if (baseAmount > limit) {
            throw new BadRequestException(
                `Amount ₹${baseAmount} exceeds your current limit of ₹${limit}. ${status === 'APPROVED'
                    ? 'Maximum allowed is ₹5,000 for verified accounts.'
                    : status === 'PENDING'
                        ? 'Maximum allowed is ₹2,000 while verification is pending.'
                        : 'Maximum allowed is ₹2,000. Please submit KYC to increase limits.'
                }`
            );
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        };
        try {
            return await this.razorpay.orders.create(options);
        } catch (error) {
            console.error(error);
            throw new BadRequestException('Failed to create Razorpay order');
        }
    }

    async verifyAndCredit(userId: string, paymentDetails: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        amount: number;
    }) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = paymentDetails;

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new BadRequestException('Invalid payment signature');
        }

        return await this.credit(userId, amount, `Razorpay: ${razorpay_payment_id}`);
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
