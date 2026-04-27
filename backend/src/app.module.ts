import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { RechargeModule } from './recharge/recharge.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoanModule } from './loan/loan.module';
import { HubbleModule } from './hubble/hubble.module';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({ 
            isGlobal: true,
            envFilePath: [
                path.resolve(process.cwd(), '.env'),
                path.resolve(process.cwd(), '.env.production'),
                '.env'
            ]
        }), 
        PrismaModule, 
        AuthModule, 
        WalletModule, 
        RechargeModule, 
        LoanModule, 
        HubbleModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
