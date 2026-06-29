import { Controller, Get, Post, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';

@Controller('automation')
export class AutomationController {
    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly prisma: PrismaService,
    ) {}

    @Get('status')
    @UseGuards(SupabaseAuthGuard)
    getStatus() {
        return this.whatsappService.getStatus();
    }

    @Get('qr')
    @UseGuards(SupabaseAuthGuard)
    getQrCode() {
        return this.whatsappService.getQrCode();
    }

    @Post('reconnect')
    @UseGuards(SupabaseAuthGuard)
    async reconnect() {
        // Trigger reconnection which clears credentials and recreates client
        await this.whatsappService.connectToWhatsApp();
        return { success: true, message: 'Reconnection sequence started' };
    }

    @Post('test-message')
    @UseGuards(SupabaseAuthGuard)
    async sendTestMessage(@Body() body: { phone: string; message: string }) {
        const { phone, message } = body;
        if (!phone || !message) {
            throw new HttpException('Phone number and message content are required', HttpStatus.BAD_REQUEST);
        }

        const res = await this.whatsappService.sendWhatsAppMessage(phone, message);
        if (!res.success) {
            throw new HttpException(res.error || 'Failed to send WhatsApp message', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return { success: true, message: 'Test message sent successfully' };
    }

    @Get('logs')
    @UseGuards(SupabaseAuthGuard)
    async getLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
    ) {
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [logs, total] = await Promise.all([
            this.prisma.automation_logs.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { created_at: 'desc' }
            }),
            this.prisma.automation_logs.count({ where })
        ]);

        return {
            success: true,
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        };
    }
}
