import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) {}

    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    async getCart(userId: string) {
        if (!this.isValidUuid(userId)) {
            throw new BadRequestException('Invalid user ID format');
        }

        const items = await this.prisma.ecommerce_cart.findMany({
            where: { user_id: userId },
            include: {
                product: {
                    include: {
                        category: true
                    }
                },
                variant: true
            },
            orderBy: { created_at: 'asc' }
        });

        return items.map(item => ({
            ...item,
            product: {
                ...item.product,
                price: Number(item.product.price),
                compare_at_price: item.product.compare_at_price ? Number(item.product.compare_at_price) : null,
                rating: Number(item.product.rating)
            },
            variant: item.variant ? {
                ...item.variant,
                price_override: item.variant.price_override ? Number(item.variant.price_override) : null
            } : null,
            unitPrice: item.variant?.price_override ? Number(item.variant.price_override) : Number(item.product.price),
            subtotal: (item.variant?.price_override ? Number(item.variant.price_override) : Number(item.product.price)) * item.quantity
        }));
    }

    async addToCart(userId: string, productId: string, variantId: string | null, quantity: number) {
        if (!this.isValidUuid(userId) || !this.isValidUuid(productId)) {
            throw new BadRequestException('Invalid ID format');
        }
        if (variantId && !this.isValidUuid(variantId)) {
            throw new BadRequestException('Invalid variant ID format');
        }
        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be positive');
        }

        // Validate product
        const product = await this.prisma.ecommerce_products.findUnique({
            where: { id: productId },
            include: { variants: true }
        });

        if (!product || !product.is_active) {
            throw new NotFoundException('Product not found or inactive');
        }

        // Validate variant if provided
        if (variantId) {
            const variantExists = product.variants.some(v => v.id === variantId);
            if (!variantExists) {
                throw new NotFoundException('Selected product variant not found');
            }
        }

        // Check if item already in cart
        const existingItem = await this.prisma.ecommerce_cart.findFirst({
            where: {
                user_id: userId,
                product_id: productId,
                variant_id: variantId || null
            }
        });

        if (existingItem) {
            return this.prisma.ecommerce_cart.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                    updated_at: new Date()
                }
            });
        }

        return this.prisma.ecommerce_cart.create({
            data: {
                user_id: userId,
                product_id: productId,
                variant_id: variantId || null,
                quantity,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    }

    async updateCart(userId: string, cartItemId: string, quantity: number, variantId?: string | null) {
        if (!this.isValidUuid(userId) || !this.isValidUuid(cartItemId)) {
            throw new BadRequestException('Invalid ID format');
        }
        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be positive');
        }

        const cartItem = await this.prisma.ecommerce_cart.findUnique({
            where: { id: cartItemId }
        });

        if (!cartItem || cartItem.user_id !== userId) {
            throw new NotFoundException('Cart item not found');
        }

        const dataToUpdate: any = {
            quantity,
            updated_at: new Date()
        };

        if (variantId !== undefined) {
            if (variantId && !this.isValidUuid(variantId)) {
                throw new BadRequestException('Invalid variant ID format');
            }
            dataToUpdate.variant_id = variantId || null;
        }

        return this.prisma.ecommerce_cart.update({
            where: { id: cartItemId },
            data: dataToUpdate
        });
    }

    async removeFromCart(userId: string, cartItemId: string) {
        if (!this.isValidUuid(userId) || !this.isValidUuid(cartItemId)) {
            throw new BadRequestException('Invalid ID format');
        }

        const cartItem = await this.prisma.ecommerce_cart.findUnique({
            where: { id: cartItemId }
        });

        if (!cartItem || cartItem.user_id !== userId) {
            throw new NotFoundException('Cart item not found');
        }

        return this.prisma.ecommerce_cart.delete({
            where: { id: cartItemId }
        });
    }

    async clearCart(userId: string) {
        return this.prisma.ecommerce_cart.deleteMany({
            where: { user_id: userId }
        });
    }
}
