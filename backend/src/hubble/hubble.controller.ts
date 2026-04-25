import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { HubbleService } from './hubble.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('hubble')
@UseGuards(AuthGuard('jwt'))
export class HubbleController {
    constructor(private readonly hubbleService: HubbleService) {}

    @Get('brands')
    async getBrands(
        @Query('category') category?: string,
        @Query('limit') limit?: number,
        @Query('pageNo') pageNo?: number
    ) {
        return this.hubbleService.getBrands(category, limit ? Number(limit) : 50, pageNo ? Number(pageNo) : 1);
    }

    @Get('brands/:id')
    async getBrandDetails(@Param('id') id: string) {
        return this.hubbleService.getBrandDetails(id);
    }

    @Post('orders')
    async placeOrder(
        @Req() req: any,
        @Body() body: { productId: string; amount: number }
    ) {
        // req.user should contain the authenticated user's details (from JWT)
        // Adjust req.user.id based on the actual JWT payload structure in Pre-pe
        const userId = req.user?.id || req.user?.sub;
        return this.hubbleService.placeOrder(userId, body.productId, body.amount);
    }

    @Get('orders/:id')
    async getOrderDetails(@Param('id') id: string) {
        return this.hubbleService.getOrder(id);
    }
}
