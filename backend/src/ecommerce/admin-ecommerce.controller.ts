import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { AdminEcommerceService } from './admin-ecommerce.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ecommerce/admin')
@UseGuards(SupabaseAuthGuard)
export class AdminEcommerceController {
    private readonly logger = new Logger(AdminEcommerceController.name);

    constructor(
        private readonly adminEcommerceService: AdminEcommerceService,
        private readonly prisma: PrismaService
    ) {}

    private async verifyAdmin(userId: string) {
        const adminRole = await this.prisma.user_roles.findFirst({
            where: {
                user_id: userId,
                role: 'ADMIN'
            }
        });
        if (!adminRole) {
            this.logger.warn(`[ECOMMERCE:UNAUTHORIZED] User ${userId} attempted administrative access`);
            throw new ForbiddenException('Only administrators can access this endpoint.');
        }
    }

    @Get('analytics')
    async getAnalytics(@Req() req: any) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.getAdminAnalytics();
    }

    @Get('sellers/pending')
    async getPendingSellers(@Req() req: any) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.getPendingSellers();
    }

    @Put('sellers/:id/approve')
    async approveSeller(
        @Req() req: any,
        @Param('id') id: string,
        @Body('approve') approve: boolean
    ) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.approveSeller(id, approve);
    }

    @Put('products/:id/approve')
    async approveProduct(
        @Req() req: any,
        @Param('id') id: string,
        @Body('approve') approve: boolean
    ) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.approveProduct(id, approve);
    }

    @Post('coupons')
    async createCoupon(@Req() req: any, @Body() body: any) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.createCoupon(body);
    }

    @Post('orders/:id/refund')
    async refundOrder(
        @Req() req: any,
        @Param('id') id: string,
        @Body('amount') amount: number,
        @Body('reason') reason: string
    ) {
        await this.verifyAdmin(req.user.sub);
        return this.adminEcommerceService.refundOrder(id, amount, reason);
    }
}
