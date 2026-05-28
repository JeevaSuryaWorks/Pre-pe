import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { ProductsService } from './products.service';

@Controller('ecommerce/products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get('categories')
    async getCategories() {
        return this.productsService.getCategories();
    }

    @Get()
    async findAll(
        @Query('categoryId') categoryId?: string,
        @Query('query') query?: string,
        @Query('brand') brand?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('rating') rating?: string,
        @Query('availability') availability?: string,
        @Query('sortBy') sortBy?: string
    ) {
        return this.productsService.findAll({
            categoryId,
            query,
            brand,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            rating: rating ? Number(rating) : undefined,
            availability,
            sortBy
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @UseGuards(SupabaseAuthGuard)
    @Post(':id/review')
    async createReview(
        @Param('id') id: string,
        @Req() req: any,
        @Body('rating') rating: number,
        @Body('comment') comment: string
    ) {
        const userId = req.user.sub;
        return this.productsService.createReview(id, userId, rating, comment);
    }
}
