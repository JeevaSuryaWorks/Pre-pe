import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PrismaService, RechargeStatus } from '../prisma/prisma.service';

@Controller('payment/callback')
export class RechargeCallbackController {
    private readonly logger = new Logger(RechargeCallbackController.name);

    constructor(private prisma: PrismaService) {}

    @Get()
    async handleCallback(
        @Query('payid') payid: string,
        @Query('client_id') client_id: string,
        @Query('operator_ref') operator_ref: string,
        @Query('status') status: string,
    ) {
        this.logger.log(`[Kwik-Callback] Received: payid=${payid}, client_id=${client_id}, status=${status}`);

        if (!payid || !client_id || !status) {
            return { status: 'ERROR', message: 'Missing parameters' };
        }

        const isSuccess = status === 'SUCCESS';
        const txnStatus = isSuccess ? RechargeStatus.SUCCESS : (status === 'FAILED' ? RechargeStatus.FAILED : RechargeStatus.PENDING);

        try {
            // Find transaction by either UUID (id) or reference_id
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const isUuid = uuidRegex.test(client_id);

            const txn = await this.prisma.transactions.findFirst({
                where: {
                    OR: [
                        isUuid ? { id: client_id } : undefined,
                        { reference_id: client_id }
                    ].filter(Boolean) as any
                }
            });

            if (!txn) {
                this.logger.warn(`[Kwik-Callback] Transaction not found for client_id: ${client_id}`);
                return { status: 'ERROR', message: 'Transaction not found' };
            }

            // Update transaction status
            const updated = await this.prisma.transactions.update({
                where: { id: txn.id },
                data: {
                    status: txnStatus,
                    api_transaction_id: operator_ref || payid,
                    updated_at: new Date(),
                },
            });

            this.logger.log(`Transaction ${txn.id} (Ref: ${txn.reference_id}) updated to ${txnStatus}`);
            
            return {
                success: true,
                message: 'Callback processed',
                context: { client_id, status }
            };
        } catch (error) {
            this.logger.error(`Error processing callback for ${client_id}: ${error.message}`);
            // Return 200 to KwikAPI anyway to stop retries
            return { status: 'ERROR', message: error.message };
        }
    }
}
