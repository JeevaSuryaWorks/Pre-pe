import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { CartService } from './cart.service';

@Controller('ecommerce/cart')
@UseGuards(SupabaseAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    async getCart(@Req() req: any) {
        const userId = req.user.sub;
        return this.cartService.getCart(userId);
    }

    @Post('add')
    async addToCart(
        @Req() req: any,
        @Body('productId') productId: string,
        @Body('variantId') variantId: string | null,
        @Body('quantity') quantity: number
    ) {
        const userId = req.user.sub;
        return this.cartService.addToCart(userId, productId, variantId, quantity);
    }

    @Put(':id')
    async updateCart(
        @Req() req: any,
        @Param('id') cartItemId: string,
        @Body('quantity') quantity: number,
        @Body('variantId') variantId?: string | null
    ) {
        const userId = req.user.sub;
        return this.cartService.updateCart(userId, cartItemId, quantity, variantId);
    }

    @Delete(':id')
    async removeFromCart(@Req() req: any, @Param('id') cartItemId: string) {
        const userId = req.user.sub;
        return this.cartService.removeFromCart(userId, cartItemId);
    }
}
