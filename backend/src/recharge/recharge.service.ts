import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RechargeStatus } from '../prisma/prisma.service';

@Injectable()
export class RechargeService {
    private readonly logger = new Logger(RechargeService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private configService: ConfigService,
    ) { }

    async initiateRecharge(
        userId: string,
        amount: number,
        mobileNumber: string,
        operator: string,
    ) {
        const referenceId = `RECHARGE_${Date.now()}_${mobileNumber}`;

        try {
            await this.walletService.debit(userId, amount, referenceId);
        } catch (e) {
            throw new BadRequestException(
                'Insufficient balance or wallet error',
            );
        }

        const transaction = await this.prisma.transactions.create({
            data: {
                user_id: userId,
                amount,
                mobile_number: mobileNumber,
                operator_id: operator,
                status: RechargeStatus.PENDING,
                type: 'DEBIT',
                service_type: 'RECHARGE',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // KwikAPI order id max safe length
        const shortOrderId =
            Date.now().toString().slice(-12) +
            Math.floor(Math.random() * 999)
                .toString()
                .padStart(3, '0');

        this.callKwikApi(
            amount,
            mobileNumber,
            operator,
            shortOrderId,
        ).then(async (success) => {
            const status = success
                ? RechargeStatus.SUCCESS
                : RechargeStatus.FAILED;

            await this.prisma.transactions.update({
                where: { id: transaction.id },
                data: {
                    status,
                    updated_at: new Date(),
                },
            });

            if (status === RechargeStatus.FAILED) {
                await this.walletService.credit(
                    userId,
                    amount,
                    `REFUND_${transaction.id}`,
                );
            }
        });

        return transaction;
    }

    private async callKwikApi(
        amount: number,
        mobileNumber: string,
        operator: string,
        orderId: string,
    ): Promise<boolean> {
        try {
            this.logger.log(
                `Recharge via proxy | ${mobileNumber} | ₹${amount}`,
            );

            // ONLY via localhost proxy (never direct KwikAPI)
            const response = await fetch(
                'http://127.0.0.1:3000/api/kwik-proxy',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: '/recharge.php',
                        method: 'GET',
                        params: {
                            number: mobileNumber,
                            amount: amount.toString(),
                            opid: operator,
                            order_id: orderId,
                        },
                    }),
                },
            );

            const text = await response.text();

            this.logger.log(`Kwik Proxy Raw Response: ${text}`);

            let data: any;

            try {
                data = JSON.parse(text);
            } catch {
                this.logger.error(
                    `Invalid JSON from proxy: ${text}`,
                );
                return false;
            }

            // success states
            if (
                data.status === 'SUCCESS' ||
                data.status === 'PENDING'
            ) {
                return true;
            }

            // failed states
            this.logger.warn(
                `Recharge failed: ${data.message ||
                data.error ||
                'Unknown error'
                }`,
            );

            return false;
        } catch (error) {
            this.logger.error(
                `Recharge proxy network error: ${error.message}`,
            );
            return false;
        }
    }
}