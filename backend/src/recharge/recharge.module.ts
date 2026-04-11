import { Module } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { RechargeController } from './recharge.controller';
import { WalletModule } from '../wallet/wallet.module';
import { KwikProxyController } from './kwik-proxy.controller';

// Force IDE re-index

@Module({
    imports: [WalletModule],
    controllers: [RechargeController, KwikProxyController],
    providers: [RechargeService],
})
export class RechargeModule { }
