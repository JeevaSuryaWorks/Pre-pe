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
        try {
            const key = this.configService.get<string>('RAZORPAY_KEY_ID');
            const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

            if (key && secret) {
                this.razorpay = new Razorpay({
                    key_id: key,
                    key_secret: secret,
                });
                this.logger.log('✅ Razorpay initialized successfully');
            } else {
                this.logger.warn('⚠️ Razorpay disabled: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
                this.razorpay = null;
            }
        } catch (error: any) {
            this.logger.error('❌ Failed to initialize Razorpay SDK', error.stack);
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
            this.logger.error('Razorpay not configured (missing key/secret)');
            throw new BadRequestException('Razorpay not configured');
        }

        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        const options = {
            amount: Math.round(amount * 100), // Ensure it's an integer
            currency: 'INR',
            receipt: `receipt_${userId.substring(0, 5)}_${Date.now()}`,
            notes: {
                userId: userId
            }
        };

        this.logger.log(`🚀 Creating Razorpay order for user ${userId}, amount: ${amount}`);
        
        try {
            const start = Date.now();
            const order = await this.razorpay.orders.create(options);
            const duration = Date.now() - start;
            
            this.logger.log(`✅ Razorpay order created: ${order.id} (took ${duration}ms)`);

            // Save order to DB for status tracking
            await this.prisma.upi_transactions.create({
                data: {
                    user_id: userId,
                    amount: new Decimal(amount),
                    upi_ref_id: order.id,
                    gateway_status: 'PENDING',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: this.configService.get<string>('RAZORPAY_KEY_ID'),
            };
        } catch (error: any) {
            this.logger.error('❌ Razorpay order creation failed', error);
            const errorMsg = error.error?.description || error.message || 'Unknown Razorpay error';
            throw new BadRequestException(`Razorpay Error: ${errorMsg}`);
        }
    }

    /* =========================================================
       🔔 HANDLE RAZORPAY WEBHOOK
    ========================================================= */
    async handleRazorpayWebhook(body: any, signature: string) {
        const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
        if (!secret) {
            this.logger.warn('⚠️ Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET not configured');
            return { status: 'ignored' };
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            this.logger.error('❌ Invalid Razorpay webhook signature');
            throw new BadRequestException('Invalid signature');
        }

        const { event, payload } = body;
        this.logger.log(`📩 Received Razorpay Webhook: ${event}`);

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;
            const amount = payment.amount / 100;
            const userId = payment.notes?.userId;

            if (!userId) {
                this.logger.error(`❌ Webhook error: No userId in payment notes for order ${orderId}`);
                return { status: 'error', message: 'No userId found' };
            }

            this.logger.log(`💰 Payment captured for order ${orderId}, user ${userId}: ₹${amount}`);

            try {
                return await this.prisma.$transaction(async (tx) => {
                    // 1. Update transaction status
                    await tx.upi_transactions.updateMany({
                        where: { upi_ref_id: orderId },
                        data: {
                            gateway_status: 'SUCCESS',
                            updated_at: new Date(),
                        },
                    });

                    // 2. Credit wallet
                    await this.credit(userId, amount, `Razorpay Top-up: ${payment.id}`);

                    this.logger.log(`✅ Wallet credited for user ${userId}`);
                    return { status: 'ok' };
                });
            } catch (error: any) {
                this.logger.error(`🔥 Webhook processing failed: ${error.message}`);
                throw new BadRequestException('Webhook processing failed');
            }
        }

        return { status: 'ok' };
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
        const vpa = this.configService.get<string>('UPI_VPA') || 'bmsmo63811085@barodampay';
        const businessName = 'PrePe Technologies Pvt Ltd';
        const merchantCode = '0000'; // General Merchant / Personal
        const intentUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(businessName)}&am=${amount}&tr=${referenceId}&mc=${merchantCode}&cu=INR&tn=${encodeURIComponent('Wallet Topup - PrePe')}`;

        this.logger.log(`📱 Creating UPI Intent for user ${userId}, amount: ${amount}`);

        try {
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
        } catch (error: any) {
            this.logger.error(`🔥 Failed to create UPI transaction: ${error.message}`, error.stack);
            throw new BadRequestException(`Payment initiation failed: ${error.message}`);
        }
    }

    /* =========================================================
       🔍 GET PAYMENT STATUS (FOR POLLING)
    ========================================================= */
    async getPaymentStatus(userId: string, referenceId: string) {
        if (!referenceId) {
            this.logger.warn(`⚠️ getPaymentStatus called without referenceId for user ${userId}`);
            return { status: 'INVALID_REQUEST' };
        }

        this.logger.log(`🔍 Checking payment status for user ${userId}, ref: ${referenceId}`);

        try {
            const txn = await this.prisma.upi_transactions.findFirst({
                where: { 
                    upi_ref_id: referenceId,
                    user_id: userId // Security: Only allow checking own transactions
                },
                orderBy: { created_at: 'desc' },
            });

            if (!txn) {
                this.logger.warn(`❌ Transaction not found for ref: ${referenceId}, user: ${userId}`);
                return { status: 'NOT_FOUND' };
            }

            this.logger.log(`✅ Status for ${referenceId}: ${txn.gateway_status}`);

            return {
                status: txn.gateway_status || 'PENDING',
                amount: Number(txn.amount),
            };
        } catch (error: any) {
            this.logger.error(`🔥 Database error during payment status check: ${error.message}`, error.stack);
            // Return a safe response instead of crashing
            return { status: 'ERROR', message: 'Internal server error' };
        }
    }
}