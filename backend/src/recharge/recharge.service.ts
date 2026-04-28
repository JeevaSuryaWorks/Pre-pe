import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RechargeStatus } from '../prisma/prisma.service';
import axios from 'axios';
import https from 'https';

@Injectable()
export class RechargeService {
    private readonly logger = new Logger(RechargeService.name);

    // FORCE IPv4 for KwikAPI requests
    private readonly agent = new https.Agent({
        family: 4,
        keepAlive: true,
        rejectUnauthorized: false,
    });

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private configService: ConfigService,
    ) { }

    async initiateRecharge(
        userId: string,
        amount: number,
        mobileNumber: string,
        operator: string
    ) {
        const referenceId = `RECHARGE_${Date.now()}_${mobileNumber}`;

        try {
            await this.walletService.debit(userId, amount, referenceId);
        } catch (e) {
            throw new BadRequestException(
                'Insufficient balance or wallet error'
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

        this.callKwikApi(
            amount,
            mobileNumber,
            operator,
            transaction.id
        ).then(async (success) => {
            const status = success
                ? RechargeStatus.SUCCESS
                : RechargeStatus.FAILED;

            await this.prisma.transactions.update({
                where: { id: transaction.id },
                data: { status },
            });

            if (status === RechargeStatus.FAILED) {
                await this.walletService.credit(
                    userId,
                    amount,
                    `REFUND_${transaction.id}`
                );
            }
        });

        return transaction;
    }

    private async callKwikApi(
        amount: number,
        mobileNumber: string,
        operator: string,
        orderId: string
    ): Promise<boolean> {
        const apiKey = this.configService.get<string>('KWIK_API_KEY');

        const baseUrl =
            this.configService.get<string>('KWIK_API_BASE_URL') ||
            'https://www.kwikapi.com/api/v2';

        try {
            const params = new URLSearchParams({
                api_key: apiKey,
                number: mobileNumber,
                amount: amount.toString(),
                opid: operator,
                order_id: orderId,
            });

            const url = `${baseUrl}/recharge.php?${params.toString()}`;

            this.logger.log(
                `Initiating recharge via KwikAPI for ${mobileNumber} | Amount: ${amount}`
            );

            const response = await axios.get(url, {
                httpsAgent: this.agent, // FORCE IPv4
                timeout: 30000,
            });

            const data = response.data;

            this.logger.log(
                `KwikAPI Response: ${JSON.stringify(data)}`
            );

            if (
                data.status === 'SUCCESS' ||
                data.status === 'PENDING'
            ) {
                return true;
            }

            this.logger.warn(
                `Recharge failed: ${data.message ||
                data.error ||
                'Unknown error'
                }`
            );

            return false;
        } catch (error: any) {
            this.logger.error(
                `KwikAPI network call failed: ${error.message}`
            );
            return false;
        }
    }
}