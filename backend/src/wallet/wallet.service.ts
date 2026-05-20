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
                this.logger.log(`✅ Razorpay initialized (Key: ${key.substring(0, 7)}...)`);
            } else {
                this.logger.warn('⚠️ Razorpay NOT initialized: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
                this.logger.debug(`[DEBUG] Key: ${!!key}, Secret: ${!!secret}`);
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
    async debit(userId: string, amount: number, description?: string, tx?: any, referenceId?: string) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

        const execute = async (prismaTx: any) => {
            if (referenceId) {
                const existingLedger = await prismaTx.wallet_ledger.findFirst({
                    where: { reference_id: referenceId }
                });
                if (existingLedger) {
                    this.logger.log(`ℹ️ [DEBIT] Ignoring duplicate request for reference: ${referenceId}`);
                    return prismaTx.wallets.findUnique({ where: { user_id: userId } });
                }
            }

            const wallet = await this.getOrCreateWallet(prismaTx, userId);
            const availableBalance = new Decimal(wallet.balance).minus(wallet.locked_balance);

            if (availableBalance.lessThan(amount)) {
                throw new BadRequestException('Insufficient available balance');
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
                    reference_id: referenceId || null,
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
    async credit(userId: string, amount: number, description?: string, tx?: any, referenceId?: string) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');

        const execute = async (prismaTx: any) => {
            if (referenceId) {
                const existingLedger = await prismaTx.wallet_ledger.findFirst({
                    where: { reference_id: referenceId }
                });
                if (existingLedger) {
                    this.logger.log(`ℹ️ [CREDIT] Ignoring duplicate request for reference: ${referenceId}`);
                    return prismaTx.wallets.findUnique({ where: { user_id: userId } });
                }
            }

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
                    reference_id: referenceId || null,
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
        console.log(`[TRACE] 1. createRazorpayOrder started for user: ${userId}, amount: ${amount}`);

        if (!this.isValidUuid(userId)) {
            console.error(`[TRACE] ❌ Invalid UUID: ${userId}`);
            throw new BadRequestException('Invalid User ID');
        }

        if (!amount || amount < 1) throw new BadRequestException('Minimum amount is ₹1');
        const maxAmount = parseInt(this.configService.get<string>('MAX_WALLET_TOPUP_AMOUNT') || '10000', 10);
        if (amount > maxAmount) throw new BadRequestException(`Maximum top-up amount is ₹${maxAmount}`);

        if (!this.razorpay) {
            console.error('[TRACE] ❌ Razorpay not initialized');
            throw new BadRequestException('Razorpay not configured');
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${userId.substring(0, 5)}_${Date.now()}`,
            notes: { userId }
        };

        const razorpayKey = this.configService.get<string>('RAZORPAY_KEY_ID');

        // Connectivity check
        try {
            console.log('[TRACE] 2. Checking DB connection...');

            await this.prisma.$queryRaw`SELECT 1`;
            console.log('[TRACE] ✅ DB Connection: OK');
        } catch (e: any) {
            console.error(`[TRACE] ❌ DB Connection: FAILED - ${e.message}`);
        }

        // Ensure user profile exists
        try {
            console.log('[TRACE] 3. Checking user profile...');
            const profile = await this.prisma.profiles.findUnique({ where: { user_id: userId } });
            if (!profile) {
                console.log(`[TRACE] ⚠️ Profile missing, creating...`);
                await this.prisma.profiles.create({
                    data: {
                        user_id: userId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        plan_type: 'BASIC'
                    }
                });
                console.log('[TRACE] ✅ Profile created');
            } else {
                console.log('[TRACE] ✅ Profile exists');
            }
        } catch (profileError: any) {
            console.error(`[TRACE] ❌ Profile operation failed: ${profileError.message}`);
        }

        try {
            console.log('[TRACE] 4. Calling Razorpay SDK...');
            const start = Date.now();
            const order = await this.razorpay.orders.create(options);
            const duration = Date.now() - start;

            console.log(`[TRACE] 5. ✅ Razorpay order created: ${order.id} (took ${duration}ms)`);

            console.log('[TRACE] 6. Saving transaction to DB...');
            await this.prisma.upi_transactions.create({
                data: {
                    user_id: userId,
                    amount: new Decimal(amount),
                    upi_ref_id: order.id,
                    gateway_status: 'PENDING',
                    payment_method: 'RAZORPAY',
                    created_at: new Date(),
                    updated_at: new Date(),
                } as any,
            });
            console.log(`[TRACE] 7. ✅ Order ${order.id} saved to DB`);

            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: razorpayKey,
            };
        } catch (error: any) {
            console.error(`[TRACE] 🔥 CRASH: ${error.message}`);
            if (error.error) console.error(`[TRACE] Details: ${JSON.stringify(error.error)}`);

            const errorMsg = error.error?.description || error.message || 'Unknown Razorpay error';
            throw new BadRequestException(`Razorpay Error: ${errorMsg}`);
        }
    }

    /* =========================================================
       🔔 HANDLE RAZORPAY WEBHOOK
    ========================================================= */
    async handleRazorpayWebhook(rawBody: Buffer, body: any, signature: string) {
        const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
        if (!secret) {
            this.logger.warn('⚠️ Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET not configured');
            return { status: 'ignored' };
        }

        // Verify signature using raw body
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(rawBody)
                .digest('hex');

            // Use timingSafeEqual to prevent timing attacks
            const isSignatureValid = crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            );

            if (!isSignatureValid) {
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
            const paymentId = payment.id;
            const amount = payment.amount / 100;
            const userId = payment.notes?.userId;

            if (!userId || !this.isValidUuid(userId)) {
                this.logger.error(`❌ Webhook error: No/Invalid userId in payment notes for order ${orderId}`);
                return { status: 'error', message: 'No valid userId found' };
            }

            this.logger.log(`💰 [WEBHOOK] Payment captured for order ${orderId}, user ${userId}: ₹${amount}`);

            try {
                return await this.prisma.$transaction(async (tx) => {
                    const txn = await tx.upi_transactions.findFirst({
                        where: { upi_ref_id: orderId }
                    });

                    if (!txn) {
                        this.logger.error(`❌ Webhook error: Transaction not found for order ${orderId}`);
                        return { status: 'error', message: 'Transaction not found' };
                    }

                    if (txn.user_id !== userId) {
                        this.logger.error(`❌ Webhook error: User ID mismatch for order ${orderId}`);
                        return { status: 'error', message: 'User mismatch' };
                    }

                    if (Number(txn.amount) !== amount) {
                        this.logger.error(`❌ Webhook error: Amount mismatch for order ${orderId}. DB: ${txn.amount}, Webhook: ${amount}`);
                        return { status: 'error', message: 'Amount mismatch' };
                    }

                    if (txn.gateway_status === 'SUCCESS' || (txn as any).razorpay_payment_id === paymentId) {
                        this.logger.log(`ℹ️ [WEBHOOK] Order ${orderId} already marked as SUCCESS or processed`);
                        return { status: 'ok' };
                    }

                    // 1. Update transaction status
                    await tx.upi_transactions.update({
                        where: { id: txn.id },
                        data: {
                            gateway_status: 'SUCCESS',
                            razorpay_payment_id: paymentId,
                            raw_response: payment,
                            updated_at: new Date(),
                        } as any,
                    });

                    // 2. Credit wallet (Passing 'tx' and referenceId)
                    await this.credit(userId, amount, `Razorpay Top-up: ${paymentId}`, tx, paymentId);

                    this.logger.log(`✅ [WEBHOOK] Wallet credited for user ${userId}, payment: ${paymentId}`);
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
                const txn = await tx.upi_transactions.findFirst({
                    where: { upi_ref_id: razorpay_order_id, user_id: userId }
                });

                if (!txn) {
                    throw new BadRequestException('Transaction not found');
                }

                if (txn.gateway_status === 'SUCCESS' || (txn as any).razorpay_payment_id === razorpay_payment_id) {
                    this.logger.log(`ℹ️ [VERIFY] Order ${razorpay_order_id} already marked as SUCCESS`);
                    return { success: true, message: 'Already credited' };
                }

                const dbAmount = Number(txn.amount);

                await tx.upi_transactions.update({
                    where: { id: txn.id },
                    data: {
                        gateway_status: 'SUCCESS',
                        razorpay_payment_id: razorpay_payment_id,
                        updated_at: new Date()
                    } as any,
                });

                await this.credit(userId, dbAmount, `Razorpay Top-up: ${razorpay_payment_id}`, tx, razorpay_payment_id);

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

        const vpa = this.configService.get<string>('UPI_VPA') || 'bmsmobiles@barodampay';
        const businessName = 'PrePe Technologies Pvt Ltd';
        const merchantCode = '0000'; // General Merchant / Personal
        const profile = await this.prisma.profiles.findUnique({ where: { user_id: userId } });
        const userName = profile?.full_name || 'User';
        const note = `Wallet Topup - ${userName} (${userId.substring(0, 8)})`;
        // Omit mc=${merchantCode} to prevent PhonePe/GPay from throwing unverified merchant risk errors.
        const intentUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(businessName)}&am=${amount}&tr=${referenceId}&cu=INR&tn=${encodeURIComponent(note)}`;

        if (process.env.NODE_ENV === 'development') {
            this.logger.log(`📱 [INIT] Intent URL: ${intentUrl}`);
        }

        this.logger.log(`📱 [INIT] Creating UPI Intent for user ${userId}, amount: ${amount}`);

        try {
            await this.prisma.upi_transactions.create({
                data: {
                    user_id: userId,
                    amount: new Decimal(amount),
                    upi_ref_id: referenceId,
                    gateway_status: 'PENDING',
                    intent_url: intentUrl,
                    payment_method: 'DIRECT_UPI_INTENT',
                    created_at: new Date(),
                    updated_at: new Date(),
                } as any,
            });

            return {
                success: true,
                intent_url: intentUrl,
                reference_id: referenceId,
                status: 'PENDING',
                message: 'UPI payment initiated. Wallet will be credited only after confirmation.',
            };
        } catch (error: any) {
            this.logger.error(`🔥 [INIT ERROR] UPI creation failed: ${error.message}`, error.stack);
            throw new BadRequestException(`Payment initiation failed: ${error.message}`);
        }
    }

    /* =========================================================
       🚫 MARK UPI INTENT FAILED
    ========================================================= */
    async markUpiIntentFailed(userId: string, referenceId: string, reason: string) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid User ID');
        if (!referenceId) throw new BadRequestException('Invalid reference_id');

        const txn = await this.prisma.upi_transactions.findFirst({
            where: { upi_ref_id: referenceId, user_id: userId },
        });

        if (!txn) {
            throw new BadRequestException('Transaction not found');
        }

        if (txn.gateway_status !== 'PENDING') {
            return { success: true, message: 'Transaction already processed' };
        }

        await this.prisma.upi_transactions.update({
            where: { id: txn.id },
            data: {
                gateway_status: 'FAILED',
                failure_reason: reason,
                failure_message: reason === 'UPI_RISK_POLICY'
                    ? 'Payment failed as per UPI risk policy. Money was not deducted.'
                    : 'Payment failed.',
                updated_at: new Date(),
            } as any,
        });

        return { success: true, message: 'Transaction marked as failed' };
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
                reference_id: txn.upi_ref_id,
                failure_reason: (txn as any).failure_reason,
                failure_message: (txn as any).failure_message,
                created_at: txn.created_at,
                updated_at: txn.updated_at,
            };
        } catch (error: any) {
            this.logger.error(`🔥 [POLL ERROR] ${error.message}`, error.stack);
            return { status: 'ERROR', message: 'Internal server error' };
        }
    }
}
