import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { WalletModule } from '../wallet/wallet.module';
import { RechargeModule } from '../recharge/recharge.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [WalletModule, RechargeModule, ConfigModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
