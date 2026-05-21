import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RechargeService } from '../recharge/recharge.service';
import { WalletService } from '../wallet/wallet.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private rechargeService: RechargeService,
    private walletService: WalletService,
  ) {}

  async createTicket(userId: string, transactionId: string, reason: string, details?: string) {
    this.logger.log(`[SUPPORT:CREATE] Ticket for user: ${userId}, Tx: ${transactionId}, Reason: ${reason}`);

    // Verify transaction exists
    const transaction = await this.prisma.transactions.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.user_id !== userId) {
      throw new BadRequestException('Transaction does not belong to this user');
    }

    // Create the ticket
    return this.prisma.support_tickets.create({
      data: {
        user_id: userId,
        transaction_id: transactionId,
        reason,
        details: details || '',
        status: 'PENDING',
      },
      include: {
        transaction: true,
      },
    });
  }

  async getUserTickets(userId: string) {
    return this.prisma.support_tickets.findMany({
      where: { user_id: userId },
      include: {
        transaction: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAdminTickets() {
    return this.prisma.support_tickets.findMany({
      include: {
        transaction: true,
        profile: {
          select: {
            full_name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async resolveTicket(ticketId: string, status: string, adminNotes?: string) {
    this.logger.log(`[SUPPORT:RESOLVE] Ticket ID: ${ticketId}, Status: ${status}`);

    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return this.prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date(),
      },
    });
  }

  async reprocessRecharge(ticketId: string) {
    this.logger.log(`[SUPPORT:REPROCESS] Processing retry for Ticket ID: ${ticketId}`);

    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
      include: { transaction: true },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const tx = ticket.transaction;
    if (!tx) {
      throw new NotFoundException('Transaction record linked to this ticket is missing');
    }

    if (tx.status === 'SUCCESS') {
      throw new BadRequestException('Transaction is already successful.');
    }

    // If the transaction failed previously, they were refunded, so we need to debit their wallet again.
    if (tx.status === 'FAILED') {
      const wallet = await this.prisma.wallets.findUnique({
        where: { user_id: tx.user_id },
      });

      if (!wallet) {
        throw new BadRequestException('User wallet not found');
      }

      if (Number(wallet.balance) < Number(tx.amount)) {
        throw new BadRequestException('Insufficient wallet balance to reprocess (user was previously refunded).');
      }

      // Debit the wallet for the retry
      this.logger.log(`[SUPPORT:REPROCESS] Debiting ₹${tx.amount} from user ${tx.user_id} for retry`);
      await this.walletService.debit(
        tx.user_id,
        Number(tx.amount),
        `Reprocess Recharge: ${tx.mobile_number} (${tx.reference_id})`,
      );

      // Update status back to PENDING first
      await this.prisma.transactions.update({
        where: { id: tx.id },
        data: { status: 'PENDING' },
      });
    }

    // Call KwikAPI directly using the public callKwikApiDirectly method
    this.logger.log(`[SUPPORT:REPROCESS] Dispatching KwikAPI for ${tx.mobile_number} (Ref: ${tx.reference_id})`);
    
    // We will change the visibility of callKwikApiDirectly in recharge.service.ts to be public
    const result: any = await (this.rechargeService as any).callKwikApiDirectly(
      Number(tx.amount),
      tx.mobile_number,
      tx.operator_id,
      tx.reference_id,
    );

    this.logger.log(`[SUPPORT:REPROCESS] KwikAPI Result: ${JSON.stringify(result)}`);

    if (result.success) {
      const isPending = result.message?.toLowerCase().includes('pending') || false;
      const finalStatus = isPending ? 'PENDING' : 'SUCCESS';

      const updatedTx = await this.prisma.transactions.update({
        where: { id: tx.id },
        data: {
          status: finalStatus,
          updated_at: new Date(),
        },
      });

      // Update the ticket to RESOLVED if recharge succeeded
      if (finalStatus === 'SUCCESS') {
        await this.prisma.support_tickets.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            admin_notes: `Automatically resolved via successful reprocessing: ${result.message}`,
            updated_at: new Date(),
          },
        });
      }

      return {
        success: true,
        status: finalStatus,
        message: result.message || 'Recharge reprocessed successfully',
        transaction: updatedTx,
      };
    } else {
      // Reprocess failed again, so we refund the debit if we made one
      this.logger.warn(`[SUPPORT:REPROCESS] Reprocess failed: ${result.message}. Refunding user wallet.`);
      
      await this.walletService.credit(
        tx.user_id,
        Number(tx.amount),
        `REFUND_RETRY_${tx.reference_id}: ${result.message || 'Reprocess API Failure'}`,
      );

      const updatedTx = await this.prisma.transactions.update({
        where: { id: tx.id },
        data: {
          status: 'FAILED',
          updated_at: new Date(),
        },
      });

      return {
        success: false,
        status: 'FAILED',
        message: result.message || 'Reprocess failed',
        transaction: updatedTx,
      };
    }
  }
}
