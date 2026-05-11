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
            }
        } catch (error: any) {
            this.logger.error('❌ Failed to initialize Razorpay SDK', error.stack);
            this.razorpay = null;
        }
    }

    /* =========================================================
       🛡️ HELPER: VALIDATE UUID
    ========================================================= */
    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    /* =========================================================
       💰 GET WALLET BALANCE
    ========================================================= */
    async getBalance(userId: string) {
        if (!this.isValidUuid(userId)) {
            throw new BadRequestException('Invalid User ID format');
        }

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
    async debit(userId: string, amount: number, description?: string, tx?: any) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

        const execute = async (prismaTx: any) => {
            const wallet = await this.getOrCreateWallet(prismaTx, userId);

            if (new Decimal(wallet.balance).lessThan(amount)) {
                throw new BadRequestException('Insufficient balance');
            }

            const updatedWallet = await prismaTx.wallets.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    updated_at: new Date(),
                },
            });

            await prismaTx.wallet_ledger.create({
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
        };

        if (tx) return execute(tx);
        return this.prisma.$transaction(async (pTx) => execute(pTx));
    }

    /* =========================================================
       🔺 CREDIT WALLET (REFUND / ADD MONEY)
    ========================================================= */
    async credit(userId: string, amount: number, description?: string, tx?: any) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

        const execute = async (prismaTx: any) => {
            const wallet = await this.getOrCreateWallet(prismaTx, userId);

            const updatedWallet = await prismaTx.wallets.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    updated_at: new Date(),
                },
            });

            await prismaTx.wallet_ledger.create({
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
        };

        if (tx) return execute(tx);
        return this.prisma.$transaction(async (pTx) => execute(pTx));
    }

    /* =========================================================
       💳 CREATE RAZORPAY ORDER
    ========================================================= */
    async createRazorpayOrder(userId: string, amount: number) {
        if (!this.isValidUuid(userId)) {
            this.logger.error(`❌ createRazorpayOrder: Invalid UUID ${userId}`);
            throw new BadRequestException('Invalid User ID');
        }

        if (!this.razorpay) {
            this.logger.error('Razorpay not configured (missing key/secret)');
            throw new BadRequestException('Razorpay not configured');
        }

        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${userId.substring(0, 5)}_${Date.now()}`,
            notes: { userId }
        };

        const razorpayKey = this.configService.get<string>('RAZORPAY_KEY_ID');
        this.logger.log(`🚀 [INIT] Creating Razorpay order for user ${userId}, amount: ${amount}`);
        
        // Connectivity check
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            this.logger.debug('✅ DB Connection: OK');
        } catch (e: any) {
            this.logger.error(`❌ DB Connection: FAILED - ${e.message}`);
        }

        // Ensure user profile exists (foreign key requirement for upi_transactions)
        try {
            const profile = await this.prisma.profiles.findUnique({ where: { user_id: userId } });
            if (!profile) {
                this.logger.log(`⚠️ Profile missing for user ${userId}, creating standard profile...`);
                await this.prisma.profiles.create({
                    data: {
                        user_id: userId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        plan_type: 'BASIC'
                    }
                });
            }
        } catch (profileError: any) {
            this.logger.error(`❌ Profile sync failed: ${profileError.message}`);
        }
        
        this.logger.debug(`[DEBUG] Razorpay Key configured: ${!!razorpayKey}`);
        
        try {
            const start = Date.now();
            const order = await this.razorpay.orders.create(options);
            const duration = Date.now() - start;
            
            this.logger.log(`✅ [SDK] Razorpay order created: ${order.id} (took ${duration}ms)`);

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
            this.logger.log(`✅ [DB] Order ${order.id} saved to upi_transactions`);

            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: razorpayKey,
            };
        } catch (error: any) {
            this.logger.error(`🔥 [ERROR] Razorpay order creation failed: ${error.message}`, error.stack);
            
            // Detailed log of error object for debugging production
            if (error.error) {
                try {
                    this.logger.error(`[DEBUG] Razorpay Error Details: ${JSON.stringify(error.error)}`);
                } catch (serializeErr) {
                    this.logger.error(`[DEBUG] Razorpay Error (Serialization failed): ${error.error}`);
                }
            }

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
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(body))
                .digest('hex');

            if (expectedSignature !== signature) {
                this.logger.error('❌ Invalid Razorpay webhook signature');
                throw new BadRequestException('Invalid signature');
            }
        } catch (e: any) {
            this.logger.error(`❌ Webhook signature verification failed: ${e.message}`);
            throw new BadRequestException('Signature verification failed');
        }

        const { event, payload } = body;
        this.logger.log(`📩 Received Razorpay Webhook: ${event}`);

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;
            const amount = payment.amount / 100;
            const userId = payment.notes?.userId;

            if (!userId || !this.isValidUuid(userId)) {
                this.logger.error(`❌ Webhook error: No/Invalid userId in payment notes for order ${orderId}`);
                return { status: 'error', message: 'No valid userId found' };
            }

            this.logger.log(`💰 [WEBHOOK] Payment captured for order ${orderId}, user ${userId}: ₹${amount}`);

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

                    // 2. Credit wallet (Passing 'tx' to avoid nested transactions)
                    await this.credit(userId, amount, `Razorpay Top-up: ${payment.id}`, tx);

                    this.logger.log(`✅ [WEBHOOK] Wallet credited for user ${userId}`);
                    return { status: 'ok' };
                });
            } catch (error: any) {
                this.logger.error(`🔥 [WEBHOOK ERROR] Processing failed: ${error.message}`, error.stack);
                throw new BadRequestException('Webhook processing failed');
            }
        }

        return { status: 'ok' };
    }

    /* =========================================================
       ✅ VERIFY PAYMENT & CREDIT WALLET (Sync fallback)
    ========================================================= */
    async verifyRazorpayPayment(userId: string, data: any) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!this.razorpay) throw new BadRequestException('Razorpay not configured');

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
        } = data;

        this.logger.log(`🔍 [VERIFY] Manual verification for order ${razorpay_order_id}, user ${userId}`);

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                'sha256',
                this.configService.get<string>('RAZORPAY_KEY_SECRET')!,
            )
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            this.logger.error(`❌ [VERIFY] Invalid signature for order ${razorpay_order_id}`);
            throw new BadRequestException('Invalid signature');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Check if already credited (via webhook)
                const txn = await tx.upi_transactions.findFirst({
                    where: { upi_ref_id: razorpay_order_id, gateway_status: 'SUCCESS' }
                });

                if (txn) {
                    this.logger.log(`ℹ️ [VERIFY] Order ${razorpay_order_id} already marked as SUCCESS`);
                    return { success: true, message: 'Already credited' };
                }

                await tx.upi_transactions.updateMany({
                    where: { upi_ref_id: razorpay_order_id },
                    data: { gateway_status: 'SUCCESS', updated_at: new Date() }
                });

                await this.credit(userId, Number(amount), `Razorpay Top-up: ${razorpay_payment_id}`, tx);
                
                this.logger.log(`✅ [VERIFY] Manual verification success for ${razorpay_order_id}`);
                return { success: true, message: 'Payment verified & wallet credited' };
            });
        } catch (error: any) {
            this.logger.error(`🔥 [VERIFY ERROR] ${error.message}`, error.stack);
            throw new BadRequestException('Verification failed');
        }
    }

    /* =========================================================
       📱 CREATE UPI INTENT
    ========================================================= */
    async createUpiIntent(userId: string, amount: number) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

        const referenceId = `UPI_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Professional UPI URL
        const vpa = this.configService.get<string>('UPI_VPA') || 'bmsmo63811085@barodampay';
        const businessName = 'PrePe Technologies Pvt Ltd';
        const merchantCode = '0000'; // General Merchant / Personal
        const intentUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(businessName)}&am=${amount}&tr=${referenceId}&mc=${merchantCode}&cu=INR&tn=${encodeURIComponent('Wallet Topup - PrePe')}`;

        this.logger.log(`📱 [INIT] Creating UPI Intent for user ${userId}, amount: ${amount}`);

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
            this.logger.error(`🔥 [INIT ERROR] UPI creation failed: ${error.message}`, error.stack);
            throw new BadRequestException(`Payment initiation failed: ${error.message}`);
        }
    }

    /* =========================================================
       🔍 GET PAYMENT STATUS (FOR POLLING)
    ========================================================= */
    async getPaymentStatus(userId: string, referenceId: string) {
        if (!this.isValidUuid(userId)) return { status: 'ERROR', message: 'Invalid User' };
        if (!referenceId) return { status: 'INVALID_REQUEST' };

        this.logger.log(`🔍 [POLL] Checking status for user ${userId}, ref: ${referenceId}`);

        try {
            const txn = await this.prisma.upi_transactions.findFirst({
                where: { upi_ref_id: referenceId, user_id: userId },
                orderBy: { created_at: 'desc' },
            });

            if (!txn) {
                this.logger.warn(`❌ [POLL] Transaction not found for ref: ${referenceId}`);
                return { status: 'NOT_FOUND' };
            }

            return {
                status: txn.gateway_status || 'PENDING',
                amount: Number(txn.amount),
            };
        } catch (error: any) {
            this.logger.error(`🔥 [POLL ERROR] ${error.message}`, error.stack);
            return { status: 'ERROR', message: 'Internal server error' };
        }
    }
}