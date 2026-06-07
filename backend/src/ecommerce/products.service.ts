import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    async getCategories() {
        return this.prisma.ecommerce_categories.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async findAll(filters: {
        categoryId?: string;
        query?: string;
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        rating?: number;
        availability?: string;
        sortBy?: string;
    }) {
        const whereClause: any = {
            is_active: true
        };

        if (filters.categoryId && this.isValidUuid(filters.categoryId)) {
            whereClause.category_id = filters.categoryId;
        }

        if (filters.brand) {
            whereClause.brand = {
                equals: filters.brand,
                mode: 'insensitive'
            };
        }

        if (filters.query) {
            whereClause.OR = [
                { title: { contains: filters.query, mode: 'insensitive' } },
                { description: { contains: filters.query, mode: 'insensitive' } }
            ];
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            whereClause.price = {};
            if (filters.minPrice !== undefined) {
                whereClause.price.gte = new Decimal(filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                whereClause.price.lte = new Decimal(filters.maxPrice);
            }
        }

        if (filters.rating !== undefined) {
            whereClause.rating = {
                gte: new Decimal(filters.rating)
            };
        }

        if (filters.availability === 'in-stock') {
            whereClause.variants = {
                some: {
                    stock: { gt: 0 }
                }
            };
        }

        let orderByClause: any = { created_at: 'desc' };
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price-asc':
                    orderByClause = { price: 'asc' };
                    break;
                case 'price-desc':
                    orderByClause = { price: 'desc' };
                    break;
                case 'rating':
                    orderByClause = { rating: 'desc' };
                    break;
                case 'popular':
                    orderByClause = { rating: 'desc' }; // fallback
                    break;
            }
        }

        const items = await this.prisma.ecommerce_products.findMany({
            where: whereClause,
            include: {
                category: true,
                variants: true
            },
            orderBy: orderByClause
        });

        return items.map(item => ({
            ...item,
            price: Number(item.price),
            compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : null,
            rating: Number(item.rating),
            totalStock: item.variants.reduce((acc, v) => acc + v.stock, 0)
        }));
    }

    async findOne(id: string) {
        if (!this.isValidUuid(id)) {
            throw new BadRequestException('Invalid product ID format');
        }

        const product = await this.prisma.ecommerce_products.findUnique({
            where: { id },
            include: {
                category: true,
                variants: true,
                reviews: true,
                seller: {
                    select: {
                        id: true,
                        company_name: true,
                        kyc_status: true,
                        status: true
                    }
                }
            }
        });

        if (!product || !product.is_active) {
            throw new NotFoundException('Product not found or inactive');
        }

        return {
            ...product,
            price: Number(product.price),
            compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
            rating: Number(product.rating),
            variants: product.variants.map(v => ({
                ...v,
                price_override: v.price_override ? Number(v.price_override) : null
            })),
            totalStock: product.variants.reduce((acc, v) => acc + v.stock, 0)
        };
    }

    async createReview(productId: string, userId: string, rating: number, comment: string) {
        if (!this.isValidUuid(productId)) {
            throw new BadRequestException('Invalid product ID format');
        }
        if (!rating || rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        const product = await this.prisma.ecommerce_products.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.$transaction(async (tx) => {
            const review = await tx.ecommerce_reviews.create({
                data: {
                    user_id: userId,
                    product_id: productId,
                    rating,
                    comment
                }
            });

            // Recalculate average product rating
            const aggregations = await tx.ecommerce_reviews.aggregate({
                where: { product_id: productId },
                _avg: {
                    rating: true
                }
            });

            const avgRating = aggregations._avg.rating || rating;

            await tx.ecommerce_products.update({
                where: { id: productId },
                data: {
                    rating: new Decimal(Number(avgRating.toFixed(2)))
                }
            });

            return review;
        });
    }

    async getSuggestedProducts(limit: number) {
        // 1. Fetch sales volumes per product from ecommerce_order_items grouped by product_id
        const salesVolumes = await this.prisma.ecommerce_order_items.groupBy({
            by: ['product_id'],
            _sum: {
                quantity: true
            }
        });

        // 2. Map sales volumes to product IDs
        const salesVolumeMap = new Map<string, number>();
        for (const vol of salesVolumes) {
            if (vol.product_id && vol._sum?.quantity) {
                salesVolumeMap.set(vol.product_id, vol._sum.quantity);
            }
        }

        // 3. Fetch active products with category and variants relations
        const products = await this.prisma.ecommerce_products.findMany({
            where: { is_active: true },
            include: {
                category: true,
                variants: true
            }
        });

        // 4. Calculate recommendation score: (salesVolume * 6.0) + (rating * 8.0)
        const scoredProducts = products.map(product => {
            const salesVolume = salesVolumeMap.get(product.id) || 0;
            const rating = Number(product.rating) || 0;
            const score = (salesVolume * 6.0) + (rating * 8.0);
            return {
                product,
                salesVolume,
                score
            };
        });

        // Sort scored products by score desc, then created_at desc
        scoredProducts.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.product.created_at.getTime() - a.product.created_at.getTime();
        });

        // Slice to limit and map to standard response
        return scoredProducts.slice(0, limit).map(sp => ({
            ...sp.product,
            price: Number(sp.product.price),
            compare_at_price: sp.product.compare_at_price ? Number(sp.product.compare_at_price) : null,
            rating: Number(sp.product.rating),
            totalStock: sp.product.variants.reduce((acc, v) => acc + v.stock, 0),
            units_sold: sp.salesVolume
        }));
    }
}
