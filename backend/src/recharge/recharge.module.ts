import { Module } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { RechargeController } from './recharge.controller';
import { WalletModule } from '../wallet/wallet.module';
import { KwikProxyController } from './kwik-proxy.controller';
import { RechargeCallbackController } from './recharge-callback.controller';


// Force IDE re-index

@Module({
    imports: [WalletModule],
    controllers: [RechargeController, KwikProxyController, RechargeCallbackController],
    providers: [RechargeService],
})
export class RechargeModule { }
