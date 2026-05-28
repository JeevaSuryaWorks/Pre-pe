import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import Razorpay from 'razorpay';

@Injectable()
export class AdminEcommerceService {
    private razorpay: Razorpay | null = null;
    private readonly logger = new Logger(AdminEcommerceService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {
        try {
            const key = this.configService.get<string>('RAZORPAY_KEY_ID');
            const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
            if (key && secret) {
                this.razorpay = new Razorpay({
                    key_id: key,
                    key_secret: secret
                });
            }
        } catch (e: any) {
            this.logger.error('Failed to initialize Razorpay in AdminEcommerceService', e.stack);
        }
    }

    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    // ==========================================
    // PLATFORM-WIDE METRICS
    // ==========================================
    async getAdminAnalytics() {
        const totalUsers = await this.prisma.profiles.count();
        const totalSellers = await this.prisma.ecommerce_sellers.count({ where: { status: 'ACTIVE' } });
        const pendingSellersCount = await this.prisma.ecommerce_sellers.count({ where: { status: 'INACTIVE', kyc_status: 'PENDING' } });
        
        const orders = await this.prisma.ecommerce_orders.findMany({
            where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }
        });

        const totalRevenues = orders.reduce((acc, curr) => acc + Number(curr.total_amount), 0);

        return {
            totalUsers,
            totalSellers,
            pendingSellersCount,
            totalOrdersProcessed: orders.length,
            totalRevenues
        };
    }

    // ==========================================
    // SELLER MODERATION
    // ==========================================
    async getPendingSellers() {
        return this.prisma.ecommerce_sellers.findMany({
            where: { kyc_status: 'PENDING' },
            orderBy: { created_at: 'desc' }
        });
    }

    async approveSeller(sellerId: string, approve: boolean, notes?: string) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');

        const seller = await this.prisma.ecommerce_sellers.findUnique({
            where: { id: sellerId }
        });
        if (!seller) throw new NotFoundException('Seller profile not found');

        const kyc_status = approve ? 'APPROVED' : 'REJECTED';
        const status = approve ? 'ACTIVE' : 'INACTIVE';

        return this.prisma.ecommerce_sellers.update({
            where: { id: sellerId },
            data: {
                kyc_status,
                status,
                updated_at: new Date()
            }
        });
    }

    // ==========================================
    // PRODUCT MODERATION
    // ==========================================
    async approveProduct(productId: string, approve: boolean) {
        if (!this.isValidUuid(productId)) throw new BadRequestException('Invalid product ID');

        const product = await this.prisma.ecommerce_products.findUnique({
            where: { id: productId }
        });
        if (!product) throw new NotFoundException('Product not found');

        return this.prisma.ecommerce_products.update({
            where: { id: productId },
            data: {
                is_active: approve,
                updated_at: new Date()
            }
        });
    }

    // ==========================================
    // COUPON CONFIGURATION
    // ==========================================
    async createCoupon(data: any) {
        return this.prisma.ecommerce_coupons.create({
            data: {
                code: data.code.toUpperCase(),
                discount_type: data.discount_type, // PERCENTAGE, FLAT
                value: new Decimal(data.value),
                min_order_value: data.min_order_value ? new Decimal(data.min_order_value) : new Decimal(0),
                max_discount: data.max_discount ? new Decimal(data.max_discount) : null,
                is_active: true,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                created_at: new Date()
            }
        });
    }

    // ==========================================
    // REFUNDS MANAGEMENT
    // ==========================================
    async refundOrder(orderId: string, amount: number, reason: string) {
        if (!this.isValidUuid(orderId)) throw new BadRequestException('Invalid order ID');
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        const order = await this.prisma.ecommerce_orders.findUnique({
            where: { id: orderId }
        });
        if (!order) throw new NotFoundException('Order not found');

        if (order.status === 'PENDING' || order.status === 'CANCELLED') {
            throw new BadRequestException('This order is not eligible for refund');
        }

        let razorpayRefundId = null;

        // Process refund via Razorpay SDK (if live credentials exist)
        if (this.razorpay && order.razorpay_order && !order.razorpay_order.startsWith('MOCK_')) {
            try {
                // Find matching upi transaction payment id
                const txn = await this.prisma.upi_transactions.findFirst({
                    where: { upi_ref_id: order.razorpay_order, gateway_status: 'SUCCESS' }
                });
                
                if (txn?.razorpay_payment_id) {
                    const refund = await this.razorpay.payments.refund(txn.razorpay_payment_id, {
                        amount: Math.round(amount * 100),
                        notes: {
                            orderId,
                            reason
                        }
                    });
                    razorpayRefundId = refund.id;
                }
            } catch (err: any) {
                this.logger.error('Razorpay Refund Request failed, UAT emulator activated', err.message);
            }
        }

        return this.prisma.$transaction(async (tx) => {
            const dbRefund = await tx.ecommerce_refunds.create({
                data: {
                    order_id: orderId,
                    amount: new Decimal(amount),
                    status: 'PROCESSED',
                    reason: reason || 'Merchant cancel / customer return',
                    razorpay_refund_id: razorpayRefundId || `MOCK_REFUND_${Date.now()}`,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            await tx.ecommerce_orders.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    updated_at: new Date()
                }
            });

            return dbRefund;
        });
    }
}
