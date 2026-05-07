import {
    Injectable,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
    private razorpay: Razorpay | null = null;
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const key = this.configService.get<string>('RAZORPAY_KEY_ID');
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (key && secret) {
            this.razorpay = new Razorpay({
                key_id: key,
                key_secret: secret,
            });
            this.logger.log('✅ Razorpay initialized');
        } else {
            this.logger.warn('⚠️ Razorpay disabled (missing keys)');
            this.razorpay = null;
        }
    }

    /* =========================================================
       💰 GET WALLET BALANCE
    ========================================================= */
    async getBalance(userId: string) {
        const wallet = await this.prisma.$transaction(async (tx) => {
            return this.getOrCreateWallet(tx, userId);
        });

        return {
            balance: Number(wallet.balance),
            locked_balance: Number(wallet.locked_balance),
            available_balance:
                Number(wallet.balance) - Number(wallet.locked_balance),
        };
    }

    /* =========================================================
       🧠 ENSURE WALLET EXISTS
    ========================================================= */
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

    /* =========================================================
       🔻 DEBIT WALLET (FOR RECHARGE)
    ========================================================= */
    async debit(userId: string, amount: number, description?: string) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

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
                    description: description || 'Recharge debit',
                    created_at: new Date(),
                },
            });

            return updatedWallet;
        });
    }

    /* =========================================================
       🔺 CREDIT WALLET (REFUND / ADD MONEY)
    ========================================================= */
    async credit(userId: string, amount: number, description?: string) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

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
                    description: description || 'Wallet credit',
                    created_at: new Date(),
                },
            });

            return updatedWallet;
        });
    }

    /* =========================================================
       💳 CREATE RAZORPAY ORDER
    ========================================================= */
    async createRazorpayOrder(userId: string, amount: number) {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay not configured');
        }

        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        try {
            const order = await this.razorpay.orders.create(options);

            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: this.configService.get<string>('RAZORPAY_KEY_ID'),
            };
        } catch (error) {
            this.logger.error('Razorpay order error', error);
            throw new BadRequestException('Failed to create Razorpay order');
        }
    }

    /* =========================================================
       ✅ VERIFY PAYMENT & CREDIT WALLET
    ========================================================= */
    async verifyRazorpayPayment(userId: string, data: any) {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay not configured');
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
        } = data;

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                'sha256',
                this.configService.get<string>('RAZORPAY_KEY_SECRET')!,
            )
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new BadRequestException('Invalid signature');
        }

        await this.credit(
            userId,
            Number(amount),
            `Razorpay Top-up: ${razorpay_payment_id}`,
        );

        return {
            success: true,
            message: 'Payment verified & wallet credited',
        };
    }

    /* =========================================================
       📱 CREATE UPI INTENT
    ========================================================= */
    async createUpiIntent(userId: string, amount: number) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        const referenceId = `UPI_${Date.now()}_${Math.floor(
            Math.random() * 1000,
        )}`;

        // Professional UPI URL
        const vpa = this.configService.get<string>('UPI_VPA') || 'jeevasuriya2007-3@okaxis';
        const businessName = 'PrePe Technologies Pvt Ltd';
        const merchantCode = '0000'; // General Merchant / Personal
        const intentUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(businessName)}&am=${amount}&tr=${referenceId}&mc=${merchantCode}&cu=INR&tn=${encodeURIComponent('Wallet Topup - PrePe')}`;

        await this.prisma.upi_transactions.create({
            data: {
                user_id: userId,
                amount: new Decimal(amount),
                upi_ref_id: referenceId,
                gateway_status: 'PENDING',
                intent_url: intentUrl,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            success: true,
            intent_url: intentUrl,
            reference_id: referenceId,
        };
    }

    /* =========================================================
       🔍 GET PAYMENT STATUS (FOR POLLING)
    ========================================================= */
    async getPaymentStatus(referenceId: string) {
        const txn = await this.prisma.upi_transactions.findFirst({
            where: { upi_ref_id: referenceId },
            orderBy: { created_at: 'desc' },
        });

        if (!txn) {
            return { status: 'NOT_FOUND' };
        }

        return {
            status: txn.gateway_status, // PENDING, SUCCESS, FAILED
            amount: Number(txn.amount),
        };
    }
}