import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { SellersService } from './sellers.service';

@Controller('ecommerce/sellers')
@UseGuards(SupabaseAuthGuard)
export class SellersController {
    constructor(private readonly sellersService: SellersService) {}

    // helper to extract seller id from the request body or resolve it from profile
    private async resolveSellerId(req: any): Promise<string> {
        const userId = req.user.sub;
        const profile = await this.sellersService.getSellerProfile(userId);
        if (!profile || !profile.exists) {
            throw new BadRequestException('Merchant account not found. Please onboard first.');
        }
        return (profile as any).id;
    }

    @Post('register')
    async registerSeller(@Req() req: any, @Body() body: any) {
        const userId = req.user.sub;
        return this.sellersService.registerSeller(userId, body);
    }

    @Get('profile')
    async getSellerProfile(@Req() req: any) {
        const userId = req.user.sub;
        return this.sellersService.getSellerProfile(userId);
    }

    @Get('dashboard')
    async getSellerDashboard(@Req() req: any) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.getSellerDashboard(sellerId);
    }

    @Get('products')
    async getSellerProducts(@Req() req: any) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.getSellerProducts(sellerId);
    }

    @Post('products')
    async createProduct(@Req() req: any, @Body() body: any) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.createProduct(sellerId, body);
    }

    @Put('variants/:id/stock')
    async updateVariantStock(
        @Req() req: any,
        @Param('id') variantId: string,
        @Body('stock') stock: number
    ) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.updateVariantStock(sellerId, variantId, stock);
    }

    @Get('orders')
    async getSellerOrders(@Req() req: any) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.getSellerOrders(sellerId);
    }

    @Put('orders/:orderId/shipment')
    async updateShipment(
        @Req() req: any,
        @Param('orderId') orderId: string,
        @Body('status') status: string
    ) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.updateShipment(sellerId, orderId, status);
    }

    @Post('withdrawals')
    async requestWithdrawal(@Req() req: any, @Body('amount') amount: number) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.requestWithdrawal(sellerId, amount);
    }

    @Get('withdrawals')
    async getWithdrawalHistory(@Req() req: any) {
        const sellerId = await this.resolveSellerId(req);
        return this.sellersService.getWithdrawalHistory(sellerId);
    }
}
