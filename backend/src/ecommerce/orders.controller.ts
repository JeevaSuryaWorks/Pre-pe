import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { OrdersService } from './orders.service';

@Controller('ecommerce/orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get('addresses')
    async getAddresses(@Req() req: any) {
        const userId = req.user.sub;
        return this.ordersService.getAddresses(userId);
    }

    @Post('addresses')
    async createAddress(@Req() req: any, @Body() body: any) {
        const userId = req.user.sub;
        return this.ordersService.createAddress(userId, body);
    }

    @Post('checkout/coupon')
    async verifyCoupon(
        @Body('code') code: string,
        @Body('subtotal') subtotal: number
    ) {
        return this.ordersService.verifyCoupon(code, subtotal);
    }

    @Post('checkout/create')
    async createOrder(
        @Req() req: any,
        @Body('addressId') addressId: string,
        @Body('couponCode') couponCode?: string
    ) {
        const userId = req.user.sub;
        return this.ordersService.createOrder(userId, addressId, couponCode);
    }

    @Post(':id/verify')
    async verifyOrderPayment(
        @Req() req: any,
        @Param('id') orderId: string,
        @Body() paymentData: any
    ) {
        const userId = req.user.sub;
        return this.ordersService.verifyOrderPayment(userId, orderId, paymentData);
    }

    @Get()
    async getOrders(@Req() req: any) {
        const userId = req.user.sub;
        return this.ordersService.getOrders(userId);
    }

    @Get(':id')
    async getOrderDetails(@Req() req: any, @Param('id') orderId: string) {
        const userId = req.user.sub;
        return this.ordersService.getOrderDetails(orderId, userId);
    }
}
