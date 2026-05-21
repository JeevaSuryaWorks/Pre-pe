import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('support')
@UseGuards(SupabaseAuthGuard)
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper to verify if the requesting user is an administrator.
   */
  private async verifyAdmin(userId: string) {
    const adminRole = await this.prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        role: 'ADMIN',
      },
    });
    if (!adminRole) {
      this.logger.warn(`[SUPPORT:UNAUTHORIZED] User ${userId} attempted admin action without ADMIN role`);
      throw new ForbiddenException('Only administrators can access this endpoint.');
    }
  }

  /**
   * User: Submit a support/complaint ticket for a transaction.
   */
  @Post('ticket')
  async createTicket(
    @Request() req: any,
    @Body() body: { transaction_id: string; reason: string; details?: string },
  ) {
    return this.supportService.createTicket(
      req.user.sub,
      body.transaction_id,
      body.reason,
      body.details,
    );
  }

  /**
   * User: Fetch my own support tickets.
   */
  @Get('tickets')
  async getUserTickets(@Request() req: any) {
    return this.supportService.getUserTickets(req.user.sub);
  }

  /**
   * Admin: List all support tickets.
   */
  @Get('admin/tickets')
  async getAdminTickets(@Request() req: any) {
    await this.verifyAdmin(req.user.sub);
    return this.supportService.getAdminTickets();
  }

  /**
   * Admin: Update ticket status and notes.
   */
  @Patch('admin/tickets/:id')
  async resolveTicket(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; admin_notes?: string },
  ) {
    await this.verifyAdmin(req.user.sub);
    return this.supportService.resolveTicket(id, body.status, body.admin_notes);
  }

  /**
   * Admin: Trigger real-time re-processing of a failed recharge.
   */
  @Post('admin/reprocess/:id')
  async reprocessRecharge(@Request() req: any, @Param('id') id: string) {
    await this.verifyAdmin(req.user.sub);
    return this.supportService.reprocessRecharge(id);
  }
}
