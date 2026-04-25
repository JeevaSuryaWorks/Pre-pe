import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { RechargeModule } from './recharge/recharge.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoanModule } from './loan/loan.module';
import { HubbleModule } from './hubble/hubble.module';

@Module({
    imports: [PrismaModule, AuthModule, WalletModule, RechargeModule, LoanModule, HubbleModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
