import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SellersService {
    constructor(private prisma: PrismaService) {}

    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    // ==========================================
    // SELLER ONBOARDING
    // ==========================================
    async registerSeller(userId: string, data: any) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid user ID');

        const existingSeller = await this.prisma.ecommerce_sellers.findUnique({
            where: { user_id: userId }
        });
        if (existingSeller) {
            throw new ConflictException('Merchant account already exists or is pending approval');
        }

        // Auto-assign distributor or retailer role in profiles if desired
        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId }
        });
        if (!profile) throw new NotFoundException('User profile not found');

        return this.prisma.ecommerce_sellers.create({
            data: {
                user_id: userId,
                company_name: data.company_name,
                gstin: data.gstin || null,
                business_phone: data.business_phone,
                address: data.address,
                kyc_status: 'PENDING',
                status: 'INACTIVE',
                commission_fee: new Decimal(10.00), // Default 10% platform fee
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    }

    async getSellerProfile(userId: string) {
        if (!this.isValidUuid(userId)) throw new BadRequestException('Invalid user ID');
        
        const seller = await this.prisma.ecommerce_sellers.findUnique({
            where: { user_id: userId }
        });
        if (!seller) {
            return { exists: false };
        }
        return { exists: true, ...seller };
    }

    // ==========================================
    // SELLER PRODUCTS MANAGEMENT
    // ==========================================
    async getSellerProducts(sellerId: string) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');
        
        const products = await this.prisma.ecommerce_products.findMany({
            where: { seller_id: sellerId },
            include: {
                category: true,
                variants: true
            },
            orderBy: { created_at: 'desc' }
        });

        return products.map(p => ({
            ...p,
            price: Number(p.price),
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            rating: Number(p.rating),
            variants: p.variants.map(v => ({
                ...v,
                price_override: v.price_override ? Number(v.price_override) : null
            })),
            totalStock: p.variants.reduce((acc, v) => acc + v.stock, 0)
        }));
    }

    async createProduct(sellerId: string, data: any) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');
        if (!data.category_id || !this.isValidUuid(data.category_id)) {
            throw new BadRequestException('Invalid category');
        }

        const seller = await this.prisma.ecommerce_sellers.findUnique({
            where: { id: sellerId }
        });
        if (!seller || seller.status !== 'ACTIVE') {
            throw new BadRequestException('Seller account is not approved or active');
        }

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.ecommerce_products.create({
                data: {
                    seller_id: sellerId,
                    category_id: data.category_id,
                    title: data.title,
                    description: data.description,
                    price: new Decimal(data.price),
                    compare_at_price: data.compare_at_price ? new Decimal(data.compare_at_price) : null,
                    brand: data.brand || 'Generic',
                    images: data.images || [],
                    specifications: data.specifications || {},
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Create Variants
            if (data.variants && data.variants.length > 0) {
                for (const variant of data.variants) {
                    await tx.ecommerce_variants.create({
                        data: {
                            product_id: product.id,
                            name: variant.name,
                            price_override: variant.price_override ? new Decimal(variant.price_override) : null,
                            stock: variant.stock || 0,
                            sku: variant.sku || `${product.title.substring(0, 3).toUpperCase()}_VAR_${Date.now()}_${Math.floor(Math.random() * 100)}`,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    });
                }
            } else {
                // Create a default variant if none provided
                await tx.ecommerce_variants.create({
                    data: {
                        product_id: product.id,
                        name: 'Default',
                        stock: data.stock || 0,
                        sku: `${product.title.substring(0, 3).toUpperCase()}_DEF_${Date.now()}`,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
            }

            return product;
        });
    }

    async updateVariantStock(sellerId: string, variantId: string, stock: number) {
        if (!this.isValidUuid(sellerId) || !this.isValidUuid(variantId)) {
            throw new BadRequestException('Invalid ID formats');
        }

        const variant = await this.prisma.ecommerce_variants.findUnique({
            where: { id: variantId },
            include: { product: true }
        });

        if (!variant || variant.product.seller_id !== sellerId) {
            throw new NotFoundException('Product variant not found under this merchant account');
        }

        return this.prisma.ecommerce_variants.update({
            where: { id: variantId },
            data: {
                stock,
                updated_at: new Date()
            }
        });
    }

    // ==========================================
    // SELLER DASHBOARD & ANALYTICS
    // ==========================================
    async getSellerDashboard(sellerId: string) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');

        const seller = await this.prisma.ecommerce_sellers.findUnique({
            where: { id: sellerId }
        });
        if (!seller) throw new NotFoundException('Seller profile not found');

        // Fetch all product items listed by the seller
        const products = await this.prisma.ecommerce_products.findMany({
            where: { seller_id: sellerId },
            include: { variants: true }
        });
        const productIds = products.map(p => p.id);

        // Fetch paid order items containing these products
        const orderItems = await this.prisma.ecommerce_order_items.findMany({
            where: {
                product_id: { in: productIds },
                order: {
                    status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                }
            },
            include: {
                order: true,
                product: true,
                variant: true
            }
        });

        const totalOrders = new Set(orderItems.map(item => item.order_id)).size;
        
        let grossSales = 0;
        for (const item of orderItems) {
            grossSales += Number(item.unit_price) * item.quantity;
        }

        const platformFeePercentage = Number(seller.commission_fee) / 100;
        const netEarnings = Math.round((grossSales * (1 - platformFeePercentage)) * 100) / 100;

        // Group Low stock items
        const lowStockItems = [];
        for (const p of products) {
            for (const v of p.variants) {
                if (v.stock <= 5) {
                    lowStockItems.push({
                        productId: p.id,
                        title: p.title,
                        variantName: v.name,
                        stock: v.stock
                    });
                }
            }
        }

        return {
            grossSales,
            netEarnings,
            totalOrders,
            totalProductsListed: products.length,
            lowStockItems,
            commissionFee: Number(seller.commission_fee)
        };
    }

    // ==========================================
    // ORDERS & DISPATCH WORKFLOWS
    // ==========================================
    async getSellerOrders(sellerId: string) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');

        const products = await this.prisma.ecommerce_products.findMany({
            where: { seller_id: sellerId }
        });
        const productIds = products.map(p => p.id);

        const orderItems = await this.prisma.ecommerce_order_items.findMany({
            where: {
                product_id: { in: productIds },
                order: {
                    status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                }
            },
            include: {
                order: {
                    include: {
                        address: true
                    }
                },
                product: true,
                variant: true
            },
            orderBy: { created_at: 'desc' }
        });

        return orderItems.map(item => ({
            ...item,
            unit_price: Number(item.unit_price),
            subtotal: Number(item.unit_price) * item.quantity,
            order: {
                ...item.order,
                total_amount: Number(item.order.total_amount)
            }
        }));
    }

    async updateShipment(sellerId: string, orderId: string, status: string) {
        if (!this.isValidUuid(sellerId) || !this.isValidUuid(orderId)) {
            throw new BadRequestException('Invalid ID format');
        }

        const allowedStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
        if (!allowedStatuses.includes(status)) {
            throw new BadRequestException('Invalid shipment status transition');
        }

        // Validate the order contains products from this seller
        const order = await this.prisma.ecommerce_orders.findUnique({
            where: { id: orderId },
            include: {
                order_items: {
                    include: { product: true }
                }
            }
        });

        if (!order) throw new NotFoundException('Order not found');

        const belongsToSeller = order.order_items.some(item => item.product.seller_id === sellerId);
        if (!belongsToSeller) {
            throw new BadRequestException('Action denied: Order details belong to another merchant');
        }

        return this.prisma.ecommerce_orders.update({
            where: { id: orderId },
            data: {
                status,
                updated_at: new Date()
            }
        });
    }

    // ==========================================
    // PAYOUT WITHDRAWALS
    // ==========================================
    async requestWithdrawal(sellerId: string, amount: number) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        // Check if there are enough net earnings minus already approved/pending withdrawals
        const dashboard = await this.getSellerDashboard(sellerId);
        const netEarnings = dashboard.netEarnings;

        const withdrawals = await this.prisma.ecommerce_withdrawals.findMany({
            where: { seller_id: sellerId, status: { in: ['PENDING', 'APPROVED'] } }
        });

        const totalWithdrawn = withdrawals.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const availablePayout = netEarnings - totalWithdrawn;

        if (amount > availablePayout) {
            throw new BadRequestException(`Insufficient funds for withdrawal. Maximum available: ₹${availablePayout.toFixed(2)}`);
        }

        return this.prisma.ecommerce_withdrawals.create({
            data: {
                seller_id: sellerId,
                amount: new Decimal(amount),
                status: 'PENDING',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    }

    async getWithdrawalHistory(sellerId: string) {
        if (!this.isValidUuid(sellerId)) throw new BadRequestException('Invalid seller ID');
        return this.prisma.ecommerce_withdrawals.findMany({
            where: { seller_id: sellerId },
            orderBy: { created_at: 'desc' }
        });
    }
}
